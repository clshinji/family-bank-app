import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Child, Transaction } from '../types';
import { Coin, PigMascot } from '../components/PigMascot';
import { themeOf } from '../components/theme';
import styles from './KidHistory.module.css';

function fmtRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor(
    (new Date(now).setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diff === 0) return 'きょう';
  if (diff === 1) return 'きのう';
  if (diff < 7) return `${diff}にちまえ`;
  return `${d.getMonth() + 1}がつ${d.getDate()}にち`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function KidHistory() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [items, setItems] = useState<Transaction[]>([]);
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      if (!childId) return;
      const res = await api.getTransactions(childId, 12, cursor);
      setItems(prev => (cursor ? [...prev, ...res.items] : res.items));
      setLastKey(res.lastKey);
    },
    [childId],
  );

  useEffect(() => {
    if (!childId) return;
    setLoading(true);
    Promise.all([api.getChild(childId).then(setChild), fetchPage()])
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [childId, fetchPage]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    items.forEach(t => {
      const key = fmtRelative(t.date);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [items]);

  const loadMore = async () => {
    if (!lastKey || loadingMore) return;
    setLoadingMore(true);
    await fetchPage(lastKey);
    setLoadingMore(false);
  };

  if (loading || !child) {
    return (
      <div className={styles.loading}>
        <PigMascot size={140} mood="sleepy" />
      </div>
    );
  }

  const theme = themeOf(child.color);
  const now = new Date();
  const monthSpend = items
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth())
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div
      className={`${styles.screen} kid-font`}
      style={{ backgroundColor: theme.swatch }}
    >
      <div className={`polka ${styles.polka}`} />

      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(`/kids/${child.childId}`)}
          aria-label="もどる"
        >
          ←
        </button>
        <div className={styles.heading}>
          <span className={styles.kidName}>{child.name}</span>
          <span className={styles.title}>おこづかいちょう</span>
        </div>
        <div className={styles.pigChip}>
          <PigMascot size={56} bounce={false} deco={child.deco} photoUrl={child.avatarUrl} />
        </div>
      </header>

      <section className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>いまのおかね</span>
          <span
            className={`${styles.summaryValue} ${child.balance < 0 ? styles.summaryNeg : ''}`}
          >
            ¥{child.balance.toLocaleString()}
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>こんげつつかった</span>
          <span className={`${styles.summaryValue} ${styles.summarySpend}`}>
            ¥{monthSpend.toLocaleString()}
          </span>
        </div>
      </section>

      <main className={styles.body}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <PigMascot size={120} bounce={false} />
            <p>まだ うごきは ないよ</p>
          </div>
        ) : (
          groups.map(([date, list]) => (
            <section key={date} className={styles.group}>
              <h2 className={styles.groupTitle}>{date}</h2>
              <div className={styles.groupCard}>
                {list.map((t, i) => (
                  <div
                    key={t.id}
                    className={styles.row}
                    style={{
                      borderBottom:
                        i < list.length - 1 ? '1px dashed rgba(61,42,78,0.12)' : 'none',
                    }}
                  >
                    <div
                      className={`${styles.iconWrap} ${t.type === 'income' ? styles.iconIn : styles.iconOut}`}
                    >
                      {t.type === 'income' ? (
                        <Coin size={28} />
                      ) : (
                        <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M6 12h12"
                            stroke="#C94E7E"
                            strokeWidth={4}
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className={styles.rowMid}>
                      <span className={styles.rowMemo}>
                        {t.memo?.trim() || (t.type === 'income' ? 'おこづかい' : t.personName)}
                      </span>
                      <span className={styles.rowMeta}>
                        {t.personName} · {fmtTime(t.date)}
                      </span>
                    </div>
                    <span
                      className={`${styles.rowAmount} ${t.type === 'income' ? styles.amtIn : styles.amtOut}`}
                    >
                      {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {lastKey && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'よみこみちゅう…' : '↓ もっとまえのを みる'}
          </button>
        )}
        {!lastKey && items.length > 0 && (
          <p className={styles.endLabel}>〜 ここまで 〜</p>
        )}
      </main>
    </div>
  );
}
