import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import type { Child } from '../types';
import styles from './ParentDashboard.module.css';

const AVATARS = ['🐱', '🐶', '🐰', '🐼', '🦊', '🐸'];

export function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchChildren = async () => {
    const res = await api.listChildren();
    setChildren(res.children);
  };

  useEffect(() => {
    fetchChildren().finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    await api.createChild({ name: newName.trim(), avatarIndex: newAvatar });
    setNewName('');
    setNewAvatar(0);
    setShowForm(false);
    await fetchChildren();
    setSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>おこづかい かんり</h1>
      </header>

      {loading ? (
        <div className={styles.loadingArea}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          >
            🪙
          </motion.div>
        </div>
      ) : (
        <>
          <div className={styles.childGrid}>
            <AnimatePresence>
              {children.map((child, i) => (
                <motion.div
                  key={child.childId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link to={`/parent/${child.childId}`} className={styles.childCard}>
                    <span className={styles.cardAvatar}>
                      {AVATARS[child.avatarIndex] ?? '🐱'}
                    </span>
                    <span className={styles.cardName}>{child.name}</span>
                    <span className={`${styles.cardBalance} ${child.balance < 0 ? styles.negative : ''}`}>
                      {child.balance.toLocaleString()} えん
                    </span>
                  </Link>
                  <Link to={`/kids/${child.childId}`} className={styles.kidPageLink}>
                    こども用ページ →
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                className={styles.formCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <h2 className={styles.formTitle}>こどもを ついか</h2>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="なまえ"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={20}
                />
                <div className={styles.avatarPicker}>
                  {AVATARS.map((emoji, idx) => (
                    <button
                      key={idx}
                      className={`${styles.avatarOption} ${idx === newAvatar ? styles.avatarSelected : ''}`}
                      onClick={() => setNewAvatar(idx)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowForm(false)}
                  >
                    やめる
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={handleCreate}
                    disabled={!newName.trim() || submitting}
                  >
                    {submitting ? 'ついかちゅう...' : 'ついか'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showForm && (
            <button
              className={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              + こどもを ついか
            </button>
          )}
        </>
      )}
    </div>
  );
}
