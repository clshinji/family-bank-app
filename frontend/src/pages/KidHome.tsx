import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Child, Transaction } from '../types';
import { CoinRain, PigMascot, Sparkle, type PigMood } from '../components/PigMascot';
import { DecoTray } from '../components/DecoTray';
import { themeOf } from '../components/theme';
import styles from './KidHome.module.css';

function useAnimatedNumber(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      setDisplay(v);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

function fmtRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now).setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diffDays === 0) return 'きょう';
  if (diffDays === 1) return 'きのう';
  if (diffDays < 7) return `${diffDays}にちまえ`;
  return `${d.getMonth() + 1}がつ${d.getDate()}にち`;
}

export function KidHome() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [decoMode, setDecoMode] = useState(false);
  const [rainTrigger, setRainTrigger] = useState(0);
  const [delta, setDelta] = useState<{ amount: number; type: 'add' | 'spend' } | null>(null);
  const lastSeenRef = useRef<number | null>(null);

  const displayBalance = useAnimatedNumber(child?.balance ?? 0, 800);

  useEffect(() => {
    if (!childId) return;
    api
      .getChild(childId)
      .then(setChild)
      .catch((e: Error) => setError(e.message));
    api
      .getTransactions(childId, 3)
      .then(res => setRecent(res.items))
      .catch(() => undefined);
  }, [childId]);

  useEffect(() => {
    if (!child) return;
    const key = `oko_lastseen_${child.childId}`;
    if (lastSeenRef.current === null) {
      const prev = parseInt(localStorage.getItem(key) ?? '', 10);
      if (!Number.isNaN(prev) && child.balance > prev) {
        const diff = child.balance - prev;
        setRainTrigger(t => t + 1);
        setDelta({ amount: diff, type: 'add' });
        window.setTimeout(() => setDelta(null), 3800);
      }
      localStorage.setItem(key, String(child.balance));
      lastSeenRef.current = child.balance;
      return;
    }
    if (child.balance > lastSeenRef.current) {
      const diff = child.balance - lastSeenRef.current;
      setRainTrigger(t => t + 1);
      setDelta({ amount: diff, type: 'add' });
      window.setTimeout(() => setDelta(null), 3800);
    } else if (child.balance < lastSeenRef.current) {
      const diff = lastSeenRef.current - child.balance;
      setDelta({ amount: diff, type: 'spend' });
      window.setTimeout(() => setDelta(null), 3000);
    }
    lastSeenRef.current = child.balance;
    localStorage.setItem(key, String(child.balance));
  }, [child]);

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <PigMascot size={140} mood="sad" bounce={false} />
        <p className={styles.errorText}>みつからなかったよ</p>
      </div>
    );
  }

  if (!child) {
    return (
      <div className={styles.loadingScreen}>
        <PigMascot size={160} mood="sleepy" />
      </div>
    );
  }

  const theme = themeOf(child.color);
  const isNegative = child.balance < 0;
  const deco = child.deco ?? [];

  const mood: PigMood = isNegative
    ? 'sad'
    : delta?.type === 'add'
      ? 'excited'
      : theme.defaultMood;

  const toggleDeco = async (id: string) => {
    const next = deco.includes(id) ? deco.filter(x => x !== id) : [...deco, id];
    const optimistic: Child = { ...child, deco: next };
    setChild(optimistic);
    try {
      const updated = await api.updateChild(child.childId, { deco: next });
      setChild(prev => (prev ? { ...prev, ...updated } : updated));
    } catch {
      setChild(child);
    }
  };

  const clearDeco = async () => {
    setChild({ ...child, deco: [] });
    try {
      const updated = await api.updateChild(child.childId, { deco: [] });
      setChild(prev => (prev ? { ...prev, ...updated } : updated));
    } catch {
      setChild(child);
    }
  };

  return (
    <div
      className={`${styles.screen} kid-font`}
      style={{ background: theme.bg }}
    >
      <div className={`polka ${styles.polka}`} />

      <Sparkle size={22} color="#FFFFFF" className="spark" style={{ position: 'absolute', top: 90, left: '8%' }} />
      <Sparkle size={16} color="#FFFFFF" className="spark" style={{ position: 'absolute', top: 160, right: '12%', animationDelay: '0.4s' }} />
      <Sparkle size={28} color="#FFE79C" className="spark" style={{ position: 'absolute', top: 280, left: '14%', animationDelay: '0.8s' }} />
      <Sparkle size={18} color="#FFFFFF" className="spark" style={{ position: 'absolute', top: 380, right: '8%', animationDelay: '0.2s' }} />

      <CoinRain count={20} trigger={rainTrigger} />

      <header className={styles.topBar}>
        <div className={styles.greetingChip} aria-hidden="true">🎀</div>
        <div className={styles.greetingText}>
          <span className={styles.greetingHello}>こんにちは</span>
          <span className={styles.greetingName}>{child.name}</span>
        </div>
        <button
          type="button"
          className={`${styles.iconBtn} ${decoMode ? styles.iconBtnActive : ''}`}
          onClick={() => setDecoMode(m => !m)}
          aria-pressed={decoMode}
          aria-label="デコる"
        >
          {decoMode ? '✓' : '✨'}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => navigate(`/kids/${child.childId}/history`)}
          aria-label="りれき"
        >
          📖
        </button>
      </header>

      <main className={styles.body}>
        <div className={styles.pigWrap}>
          <PigMascot
            size={220}
            mood={mood}
            bounce={!isNegative}
            deco={deco}
            photoUrl={child.avatarUrl}
          />
          {delta && (
            <div className={`pop-in ${styles.bubble}`}>
              {delta.type === 'add'
                ? `+¥${delta.amount.toLocaleString()} ふえたよ!`
                : `-¥${delta.amount.toLocaleString()} つかったよ`}
            </div>
          )}
        </div>

        <section className={styles.balanceCard}>
          <span
            className={`${styles.balanceBadge} ${isNegative ? styles.balanceBadgeNeg : ''}`}
          >
            {isNegative ? 'いま かりてるよ…' : 'いまのおこづかい'}
          </span>
          <span className={styles.balanceUnit}>¥</span>
          <div
            className={`${styles.balanceNumber} ${isNegative ? styles.balanceNumberNeg : ''}`}
          >
            {Math.abs(displayBalance).toLocaleString('ja-JP')}
          </div>
          <span className={styles.balanceCaption}>
            {isNegative ? 'がんばって かえそう!' : 'えん たまってるよ!'}
          </span>
        </section>

        {decoMode ? (
          <div className={styles.decoSlot}>
            <DecoTray deco={deco} onToggle={toggleDeco} onClear={clearDeco} />
          </div>
        ) : (
          <section className={styles.recentCard}>
            <h2 className={styles.recentTitle}>さいきんのうごき</h2>
            <div className={styles.recentList}>
              {recent.length === 0 ? (
                <p className={styles.recentEmpty}>まだ うごきは ないよ</p>
              ) : (
                recent.map((t, i) => (
                  <div
                    key={t.id}
                    className={styles.recentRow}
                    style={{
                      borderBottom:
                        i < recent.length - 1
                          ? '1px dashed rgba(61,42,78,0.12)'
                          : 'none',
                    }}
                  >
                    <span
                      className={`${styles.recentIcon} ${t.type === 'income' ? styles.recentIncome : styles.recentExpense}`}
                    >
                      {t.type === 'income' ? '＋' : '－'}
                    </span>
                    <div className={styles.recentMid}>
                      <span className={styles.recentMemo}>
                        {t.memo?.trim() || (t.type === 'income' ? 'おこづかい' : t.personName)}
                      </span>
                      <span className={styles.recentMeta}>{fmtRelative(t.date)}</span>
                    </div>
                    <span
                      className={`${styles.recentAmt} ${t.type === 'income' ? styles.recentIncome : styles.recentExpense}`}
                    >
                      {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
