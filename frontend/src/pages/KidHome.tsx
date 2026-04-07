import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import type { Child } from '../types';
import { Avatar } from '../components/Avatar';
import styles from './KidHome.module.css';

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

export function KidHome() {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [error, setError] = useState('');
  const displayBalance = useCountUp(child?.balance ?? 0);

  useEffect(() => {
    if (!childId) return;
    api.getChild(childId).then(setChild).catch(e => setError(e.message));
  }, [childId]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <span className={styles.errorEmoji}>😢</span>
          <p>みつからなかったよ</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <motion.div
            className={styles.loadingCoin}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          >
            🪙
          </motion.div>
        </div>
      </div>
    );
  }

  const isNegative = child.balance < 0;

  return (
    <div className={styles.container}>
      <div className={styles.bgDecor}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.floatingStar}
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -12, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + i * 0.5,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      <motion.div
        className={styles.avatarArea}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Avatar avatarIndex={child.avatarIndex} avatarUrl={child.avatarUrl} size="lg" className={styles.avatar} />
        <h1 className={styles.name}>{child.name}の おこづかい</h1>
      </motion.div>

      <motion.div
        className={`${styles.balanceCard} ${isNegative ? styles.balanceNegative : ''}`}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
      >
        <p className={styles.balanceLabel}>いまの のこり</p>
        <div className={styles.balanceRow}>
          <motion.span
            className={styles.balanceNumber}
            key={child.balance}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
          >
            {displayBalance.toLocaleString()}
          </motion.span>
          <span className={styles.balanceUnit}>えん</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link to={`/kids/${childId}/history`} className={styles.historyButton}>
          りれきを みる →
        </Link>
      </motion.div>
    </div>
  );
}
