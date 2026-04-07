import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import type { Child } from '../types';
import { ShareModal } from '../components/ShareModal';
import { Avatar, AVATARS } from '../components/Avatar';
import styles from './ParentDashboard.module.css';

export function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [shareChild, setShareChild] = useState<Child | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

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

  const handleDelete = async (child: Child) => {
    if (!confirm(`「${child.name}」を削除しますか？\nおこづかいの履歴もすべて消えます。`)) return;
    setDeletingId(child.childId);
    await api.deleteChild(child.childId);
    await fetchChildren();
    setDeletingId(null);
  };

  const handlePhotoClick = (childId: string) => {
    setUploadTargetId(childId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    setUploadingId(uploadTargetId);
    try {
      await api.uploadAvatar(uploadTargetId, file);
      await fetchChildren();
    } catch {
      alert('アップロードに失敗しました');
    }
    setUploadingId(null);
    setUploadTargetId(null);
    e.target.value = '';
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />

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
                  className={styles.childItem}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link to={`/parent/${child.childId}`} className={styles.childCard}>
                    <div className={styles.avatarWrapper}>
                      <Avatar
                        avatarIndex={child.avatarIndex}
                        avatarUrl={child.avatarUrl}
                        size="md"
                      />
                      <button
                        className={styles.avatarEditButton}
                        onClick={(e) => { e.preventDefault(); handlePhotoClick(child.childId); }}
                        disabled={uploadingId === child.childId}
                        title="写真を変更"
                      >
                        {uploadingId === child.childId ? '...' : '📷'}
                      </button>
                    </div>
                    <span className={styles.cardName}>{child.name}</span>
                    <span className={`${styles.cardBalance} ${child.balance < 0 ? styles.negative : ''}`}>
                      {child.balance.toLocaleString()} えん
                    </span>
                  </Link>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.shareButton}
                      onClick={() => setShareChild(child)}
                    >
                      QR / リンクを共有
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(child)}
                      disabled={deletingId === child.childId}
                    >
                      {deletingId === child.childId ? '削除中...' : '削除'}
                    </button>
                  </div>
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
      {shareChild && (
        <ShareModal child={shareChild} onClose={() => setShareChild(null)} />
      )}
    </div>
  );
}
