import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import type { Child, Transaction } from '../types';
import { Toast } from '../components/Toast';
import styles from './ParentOperate.module.css';

const QUICK_NAMES = ['おとうさん', 'おかあさん', 'おじいちゃん', 'おばあちゃん'];

export function ParentOperate() {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [mode, setMode] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [personName, setPersonName] = useState('');
  const [showMemo, setShowMemo] = useState(false);
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
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

  const handleSubmit = useCallback(async () => {
    if (!childId || !amount || !personName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const txn = await api.postTransaction(childId, {
        personName: personName.trim(),
        amount: parseInt(amount, 10),
        type: mode,
        memo: memo.trim() || undefined,
      });
      const label = mode === 'income' ? 'あげました' : 'つかいました';
      setToast({
        visible: true,
        message: `${txn.amount.toLocaleString()}えん ${label}`,
        type: 'success',
      });
      setAmount('');
      setMemo('');
      setShowMemo(false);
      const updated = await api.getChild(childId);
      setChild(updated);
      const txns = await api.getTransactions(childId, 5);
      setRecentTxns(txns.items);
    } catch (e: unknown) {
      setToast({
        visible: true,
        message: e instanceof Error ? e.message : 'エラーが発生しました',
        type: 'error',
      });
    }
    setSubmitting(false);
  }, [childId, amount, personName, submitting, mode, memo]);

  if (!child) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingArea}>🪙</div>
      </div>
    );
  }

  const canSubmit = !!amount && !!personName.trim() && !submitting;

  return (
    <div className={styles.container}>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))}
      />

      <header className={styles.header}>
        <Link to="/parent" className={styles.backButton}>←</Link>
        <h1 className={styles.title}>{child.name}</h1>
        <span className={`${styles.currentBalance} ${child.balance < 0 ? styles.negative : ''}`}>
          {child.balance.toLocaleString()} えん
        </span>
      </header>

      {/* 1. モードトグル */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${mode === 'income' ? styles.modeActive : ''} ${mode === 'income' ? styles.modeIncome : ''}`}
          onClick={() => { setMode('income'); setPersonName(''); }}
        >
          あげる
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'expense' ? styles.modeActive : ''} ${mode === 'expense' ? styles.modeExpense : ''}`}
          onClick={() => { setMode('expense'); setPersonName(''); }}
        >
          つかう
        </button>
      </div>

      {/* 2. だれが？ / なにに？ */}
      <div className={styles.nameSection}>
        {mode === 'income' ? (
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
            <input
              className={styles.nameInput}
              type="text"
              placeholder="ほかのひと"
              value={QUICK_NAMES.includes(personName) ? '' : personName}
              onChange={e => setPersonName(e.target.value)}
              maxLength={20}
            />
          </div>
        ) : (
          <input
            className={styles.usageInput}
            type="text"
            placeholder="なにに つかった？ (おかし、ゲーム など)"
            value={personName}
            onChange={e => setPersonName(e.target.value)}
            maxLength={30}
          />
        )}
      </div>

      {/* 3. 金額表示 */}
      <div className={styles.amountDisplay}>
        <span className={styles.amountPrefix}>{mode === 'income' ? '+' : '-'}</span>
        <span className={styles.amountValue}>
          {amount ? parseInt(amount, 10).toLocaleString() : '0'}
        </span>
        <span className={styles.amountUnit}>えん</span>
      </div>

      {/* 4. NumPad */}
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

      {/* 5. メモ (折りたたみ) */}
      {showMemo ? (
        <input
          className={styles.memoInput}
          type="text"
          placeholder="メモ (おてつだい、おかし など)"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          maxLength={50}
          autoFocus
        />
      ) : (
        <button className={styles.memoToggle} onClick={() => setShowMemo(true)}>
          + メモを追加
        </button>
      )}

      {/* 6. 最近のやりとり */}
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

      {/* 7. 実行ボタン (fixed bottom) */}
      <div className={styles.fixedBottom}>
        <motion.button
          className={`${styles.submitButton} ${mode === 'income' ? styles.submitIncome : styles.submitExpense}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
          whileTap={{ scale: 0.97 }}
        >
          {submitting
            ? 'しょりちゅう...'
            : !personName.trim()
              ? mode === 'income' ? 'だれが？を えらんでね' : 'つかいみちを いれてね'
              : !amount
                ? 'きんがくを いれてね'
                : mode === 'income'
                  ? `${parseInt(amount, 10).toLocaleString()}えん あげる`
                  : `${parseInt(amount, 10).toLocaleString()}えん つかう`
          }
        </motion.button>
      </div>
    </div>
  );
}
