import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import type { Child } from '../types';
import { Avatar } from './Avatar';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  child: Child;
  onClose: () => void;
}

export function ShareModal({ child, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const kidUrl = `${window.location.origin}/kids/${child.childId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(kidUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          <button className={styles.closeButton} onClick={onClose}>✕</button>

          <div className={styles.profile}>
            <Avatar avatarIndex={child.avatarIndex} avatarUrl={child.avatarUrl} size="lg" className={styles.avatar} />
            <h2 className={styles.name}>{child.name}</h2>
            <p className={styles.subtitle}>こども用ページ</p>
          </div>

          <div className={styles.qrArea}>
            <div className={styles.qrWrapper}>
              <QRCode
                value={kidUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#5C4033"
                level="M"
              />
            </div>
            <p className={styles.qrHint}>スマホやタブレットで読み取ってね</p>
          </div>

          <div className={styles.urlSection}>
            <label className={styles.urlLabel}>ページURL</label>
            <div className={styles.urlRow}>
              <input
                className={styles.urlInput}
                type="text"
                value={kidUrl}
                readOnly
                onFocus={e => e.target.select()}
              />
              <button className={styles.copyButton} onClick={handleCopy}>
                {copied ? 'コピーした!' : 'コピー'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
