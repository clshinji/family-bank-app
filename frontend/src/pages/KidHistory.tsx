import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import type { Transaction } from '../types';
import styles from './KidHistory.module.css';

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}がつ ${d.getDate()}にち`;
}

export function KidHistory() {
  const { childId } = useParams<{ childId: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTransactions = useCallback(async (key?: string) => {
    if (!childId) return;
    const res = await api.getTransactions(childId, 20, key);
    if (key) {
      setTransactions(prev => [...prev, ...res.items]);
    } else {
      setTransactions(res.items);
    }
    setLastKey(res.lastKey);
  }, [childId]);

  useEffect(() => {
    setLoading(true);
    fetchTransactions().finally(() => setLoading(false));
  }, [fetchTransactions]);

  const loadMore = async () => {
    if (!lastKey || loadingMore) return;
    setLoadingMore(true);
    await fetchTransactions(lastKey);
    setLoadingMore(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to={`/kids/${childId}`} className={styles.backButton}>
          ← もどる
        </Link>
        <h1 className={styles.title}>おこづかい りれき</h1>
      </header>

      {loading ? (
        <div className={styles.loadingArea}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className={styles.loadingCoin}
          >
            🪙
          </motion.div>
        </div>
      ) : transactions.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📭</span>
          <p className={styles.emptyText}>まだ おこづかいは ないよ!</p>
        </div>
      ) : (
        <>
          <ul className={styles.list}>
            <AnimatePresence>
              {transactions.map((txn, i) => (
                <motion.li
                  key={txn.id}
                  className={styles.item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <div className={styles.itemTop}>
                    <span className={styles.date}>{formatDate(txn.date)}</span>
                    <span className={`${styles.badge} ${txn.type === 'income' ? styles.badgeIncome : styles.badgeExpense}`}>
                      {txn.personName}
                    </span>
                  </div>
                  <div className={styles.itemBottom}>
                    <span className={`${styles.amount} ${txn.type === 'income' ? styles.amountIncome : styles.amountExpense}`}>
                      {txn.type === 'income' ? '+' : '-'}{txn.amount.toLocaleString()} えん
                    </span>
                    <span className={styles.balanceAfter}>
                      のこり {txn.balanceAfter.toLocaleString()} えん
                    </span>
                  </div>
                  {txn.memo && (
                    <p className={styles.memo}>{txn.memo}</p>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {lastKey && (
            <button
              className={styles.loadMoreButton}
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'よみこみちゅう...' : 'もっと みる'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
