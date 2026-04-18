import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Child, Transaction } from '../types';
import { PigMascot } from '../components/PigMascot';
import { THEMES } from '../components/theme';
import { Toast } from '../components/Toast';
import styles from './ParentOperate.module.css';

const QUICK_NAMES = ['おかあさん', 'おとうさん', 'おばあちゃん', 'おじいちゃん'];

function fmtRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor(
    (new Date(now).setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diff === 0) return 'きょう';
  if (diff === 1) return 'きのう';
  if (diff < 7) return `${diff}にちまえ`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ParentOperate() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const [child, setChild] = useState<Child | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [mode, setMode] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [by, setBy] = useState('おかあさん');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const refresh = useCallback(async () => {
    if (!childId) return;
    const [c, t] = await Promise.all([
      api.getChild(childId),
      api.getTransactions(childId, 5),
    ]);
    setChild(c);
    setRecent(t.items);
  }, [childId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleKey = (k: string) => {
    if (k === 'AC') setAmount('');
    else if (k === '⌫') setAmount(a => a.slice(0, -1));
    else if (k === '00') setAmount(a => (a === '' ? '' : (a + '00').slice(0, 7)));
    else setAmount(a => (a === '0' ? k : (a + k).slice(0, 7)));
  };

  const submit = async () => {
    if (!child || !amount || !by.trim() || submitting) return;
    const n = parseInt(amount, 10);
    if (!n) return;
    setSubmitting(true);
    try {
      await api.postTransaction(child.childId, {
        type: mode,
        amount: n,
        memo: memo.trim() || undefined,
        personName: by.trim(),
      });
      setAmount('');
      setMemo('');
      await refresh();
      setToast({
        visible: true,
        message: mode === 'income' ? `¥${n.toLocaleString()} あげました` : `¥${n.toLocaleString()} つかいました`,
        type: 'success',
      });
    } catch (e) {
      setToast({
        visible: true,
        message: e instanceof Error ? e.message : 'エラーがおこりました',
        type: 'error',
      });
    }
    setSubmitting(false);
  };

  if (!child) {
    return (
      <div className={styles.loading}>
        <PigMascot size={120} mood="sleepy" />
      </div>
    );
  }

  const swatch = THEMES[child.color ?? 'pink'].swatch;
  const preview =
    mode === 'income'
      ? child.balance + parseInt(amount || '0', 10)
      : child.balance - parseInt(amount || '0', 10);
  const canSubmit = !!amount && !!by.trim() && !submitting;

  return (
    <div className={styles.screen}>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))}
      />

      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate('/parent')}
          aria-label="もどる"
        >
          ←
        </button>
        <div className={styles.headTitle}>
          <span className={styles.headEyebrow}>そうさ</span>
          <span className={styles.headName}>{child.name}</span>
        </div>
        <div className={styles.headPig} style={{ background: swatch }}>
          <PigMascot size={40} bounce={false} deco={child.deco} photoUrl={child.avatarUrl} />
        </div>
      </header>

      <div className={styles.modeWrap}>
        <div className={styles.modeTrack}>
          <span
            className={styles.modeThumb}
            style={{
              left: mode === 'income' ? '3px' : '50%',
              background: mode === 'income' ? '#34C759' : '#F27CA7',
            }}
          />
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'income' ? styles.modeBtnOn : ''}`}
            onClick={() => setMode('income')}
          >
            ＋ あげる
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'expense' ? styles.modeBtnOn : ''}`}
            onClick={() => setMode('expense')}
          >
            － つかう
          </button>
        </div>
      </div>

      <div className={styles.amountArea}>
        <span className={styles.previewText}>
          いま ¥{child.balance.toLocaleString()}
          {amount && ` → ¥${preview.toLocaleString()}`}
        </span>
        <div className={styles.amountValue}>
          <span className={styles.yenMark}>¥</span>
          <span className={amount ? styles.amount : styles.amountPlaceholder}>
            {amount ? parseInt(amount, 10).toLocaleString('ja-JP') : '0'}
          </span>
        </div>
      </div>

      <div className={styles.formBlock}>
        <input
          className={styles.memoInput}
          type="text"
          placeholder={mode === 'income' ? 'メモ: おてつだい' : 'メモ: おかし'}
          value={memo}
          onChange={e => setMemo(e.target.value)}
          maxLength={50}
        />
      </div>

      <div className={styles.formBlock}>
        <span className={styles.formLabel}>
          だれが? <span className={styles.required}>*</span>
        </span>
        <div className={styles.chipRow}>
          {QUICK_NAMES.map(n => (
            <button
              key={n}
              type="button"
              className={`${styles.chip} ${by === n ? styles.chipOn : ''}`}
              onClick={() => setBy(n)}
            >
              {n}
            </button>
          ))}
          <input
            className={styles.byInput}
            type="text"
            placeholder="ほかのひと"
            value={QUICK_NAMES.includes(by) ? '' : by}
            onChange={e => setBy(e.target.value)}
            maxLength={20}
          />
        </div>
      </div>

      <div className={styles.keypad}>
        {(['1', '2', '3', 'AC', '4', '5', '6', '00', '7', '8', '9', '⌫', '_', '0', '_', 'OK'] as const).map((k, i) => {
          if (k === '_') {
            return <span key={`spacer-${i}`} />;
          }
          if (k === 'AC' || k === '00' || k === '⌫') {
            return (
              <button
                key={k}
                type="button"
                className={`${styles.key} ${styles.keyAlt}`}
                onClick={() => handleKey(k)}
              >
                {k}
              </button>
            );
          }
          if (k === 'OK') {
            return (
              <button
                key={k}
                type="button"
                className={`${styles.key} ${styles.keyOk}`}
                style={{
                  background: !canSubmit
                    ? '#C7C7CC'
                    : mode === 'income'
                      ? '#34C759'
                      : '#F27CA7',
                }}
                disabled={!canSubmit}
                onClick={submit}
              >
                {submitting ? '…' : 'OK'}
              </button>
            );
          }
          return (
            <button
              key={`${k}-${i}`}
              type="button"
              className={styles.key}
              onClick={() => handleKey(k)}
            >
              {k}
            </button>
          );
        })}
      </div>

      <section className={styles.recent}>
        <h2 className={styles.recentTitle}>さいきんのそうさ</h2>
        {recent.length === 0 ? (
          <p className={styles.recentEmpty}>まだ そうさはありません</p>
        ) : (
          <ul className={styles.recentList}>
            {recent.map(t => (
              <li key={t.id} className={styles.recentRow}>
                <span
                  className={styles.recentBar}
                  style={{
                    background: t.type === 'income' ? '#34C759' : '#F27CA7',
                  }}
                />
                <div className={styles.recentMid}>
                  <span className={styles.recentMemo}>
                    {t.memo?.trim() || (t.type === 'income' ? 'おこづかい' : 'つかった')}
                  </span>
                  <span className={styles.recentMeta}>
                    {t.personName} · {fmtRelative(t.date)}
                  </span>
                </div>
                <span
                  className={styles.recentAmt}
                  style={{ color: t.type === 'income' ? '#2E9D6E' : '#C94E7E' }}
                >
                  {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
