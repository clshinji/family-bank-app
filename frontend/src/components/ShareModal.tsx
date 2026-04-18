import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import type { Child } from '../types';
import { PigMascot } from './PigMascot';
import { THEMES } from './theme';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  child: Child;
  onClose: () => void;
}

export function ShareModal({ child, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const kidUrl = `${window.location.origin}/kids/${child.childId}`;
  const swatch = THEMES[child.color ?? 'pink'].swatch;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(kidUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
        >
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="とじる">
            ✕
          </button>

          <div className={styles.profile} style={{ background: swatch }}>
            <PigMascot size={86} bounce={false} deco={child.deco} photoUrl={child.avatarUrl} />
          </div>

          <h2 className={styles.name}>{child.name}のページ</h2>
          <p className={styles.subtitle}>スキャンまたはURLで すぐにアクセスできます</p>

          <div className={styles.qrArea}>
            <div className={styles.qrWrapper}>
              <QRCode
                value={kidUrl}
                size={184}
                bgColor="#FFFFFF"
                fgColor="#1C1C1E"
                level="H"
                style={{ display: 'block' }}
              />
              <div className={styles.qrCenter}>
                <PigMascot size={44} bounce={false} />
              </div>
            </div>
          </div>

          <div className={styles.urlSection}>
            <div className={styles.urlRow}>
              <input
                className={styles.urlInput}
                type="text"
                value={kidUrl}
                readOnly
                onFocus={e => e.target.select()}
              />
              <button type="button" className={styles.copyButton} onClick={handleCopy}>
                {copied ? 'コピーした!' : 'コピー'}
              </button>
            </div>
          </div>

          <button type="button" className={styles.doneBtn} onClick={onClose}>
            とじる
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
