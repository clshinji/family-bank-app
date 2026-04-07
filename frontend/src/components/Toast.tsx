import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  visible: boolean;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, type = 'success', visible, onDismiss, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [visible, onDismiss, durationMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`${styles.toast} ${type === 'error' ? styles.error : styles.success}`}
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={onDismiss}
        >
          <span className={styles.icon}>{type === 'success' ? '🎉' : '😢'}</span>
          <span className={styles.message}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
