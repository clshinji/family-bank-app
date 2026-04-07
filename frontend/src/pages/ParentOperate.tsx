import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import type { Child, Transaction } from '../types';
import styles from './ParentOperate.module.css';

const QUICK_NAMES = ['おとうさん', 'おかあさん', 'おじいちゃん', 'おばあちゃん'];

export function ParentOperate() {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [mode, setMode] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [personName, setPersonName] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Transaction | null>(null);
  const [error, setError] = useState('');
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!childId) return;
    api.getChild(childId).then(setChild);
    api.getTransactions(childId, 5).then(res => setRecentTxns(res.items));
  }, [childId]);

  const handleNumPad = (val: string) => {
    if (val === 'C') {
      setAmount('');
    } else if (val === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      setAmount(prev => {
        if (prev.length >= 7) return prev;
        if (prev === '' && val === '0') return prev;
        return prev + val;
      });
    }
  };

  const handleSubmit = async () => {
    if (!childId || !amount || !personName.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const txn = await api.postTransaction(childId, {
        personName: personName.trim(),
        amount: parseInt(amount, 10),
        type: mode,
        memo: memo.trim() || undefined,
      });
      setSuccess(txn);
      setAmount('');
      setMemo('');
      const updated = await api.getChild(childId);
      setChild(updated);
      const txns = await api.getTransactions(childId, 5);
      setRecentTxns(txns.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    }
    setSubmitting(false);
  };

  if (!child) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingArea}>🪙</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/parent" className={styles.backButton}>← もどる</Link>
        <h1 className={styles.title}>{child.name}</h1>
        <span className={`${styles.currentBalance} ${child.balance < 0 ? styles.negative : ''}`}>
          {child.balance.toLocaleString()} えん
        </span>
      </header>

      <AnimatePresence>
        {success && (
          <motion.div
            className={styles.successBanner}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{success.type === 'income' ? '🎉' : '📝'}</span>
            <span>
              {success.type === 'income' ? '+' : '-'}{success.amount.toLocaleString()} えん
              {success.type === 'income' ? ' あげました' : ' つかいました'}
            </span>
            <button onClick={() => setSuccess(null)} className={styles.dismissButton}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${mode === 'income' ? styles.modeActive : ''} ${mode === 'income' ? styles.modeIncome : ''}`}
          onClick={() => setMode('income')}
        >
          あげる
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'expense' ? styles.modeActive : ''} ${mode === 'expense' ? styles.modeExpense : ''}`}
          onClick={() => setMode('expense')}
        >
          つかう
        </button>
      </div>

      <div className={styles.amountDisplay}>
        <span className={styles.amountPrefix}>{mode === 'income' ? '+' : '-'}</span>
        <span className={styles.amountValue}>
          {amount ? parseInt(amount, 10).toLocaleString() : '0'}
        </span>
        <span className={styles.amountUnit}>えん</span>
      </div>

      <div className={styles.numPad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
          <button
            key={key}
            className={`${styles.numKey} ${key === 'C' || key === '⌫' ? styles.numKeyAlt : ''}`}
            onClick={() => handleNumPad(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div className={styles.nameSection}>
        <label className={styles.label}>だれが？</label>
        <div className={styles.quickNames}>
          {QUICK_NAMES.map(name => (
            <button
              key={name}
              className={`${styles.quickNamePill} ${personName === name ? styles.quickNameActive : ''}`}
              onClick={() => setPersonName(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <input
          className={styles.input}
          type="text"
          placeholder="なまえを いれる"
          value={personName}
          onChange={e => setPersonName(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className={styles.memoSection}>
        <label className={styles.label}>メモ (にゅうりょくしなくてもOK)</label>
        <input
          className={styles.input}
          type="text"
          placeholder="おてつだい、おかし など"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          maxLength={50}
        />
      </div>

      <button
        className={`${styles.submitButton} ${mode === 'income' ? styles.submitIncome : styles.submitExpense}`}
        onClick={handleSubmit}
        disabled={!amount || !personName.trim() || submitting}
      >
        {submitting ? 'しょりちゅう...' : mode === 'income' ? 'あげる' : 'つかう'}
      </button>

      {recentTxns.length > 0 && (
        <div className={styles.recentSection}>
          <h2 className={styles.recentTitle}>さいきんの やりとり</h2>
          <ul className={styles.recentList}>
            {recentTxns.map(txn => (
              <li key={txn.id} className={styles.recentItem}>
                <span className={styles.recentName}>{txn.personName}</span>
                <span className={`${styles.recentAmount} ${txn.type === 'income' ? styles.recentIncome : styles.recentExpense}`}>
                  {txn.type === 'income' ? '+' : '-'}{txn.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
