import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import type { Child } from '../types';
import { ShareModal } from '../components/ShareModal';
import { Avatar, AVATARS } from '../components/Avatar';
import { ImageCropModal } from '../components/ImageCropModal';
import { Toast } from '../components/Toast';
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
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropTargetId, setCropTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [confirmDelete, setConfirmDelete] = useState<Child | null>(null);
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);

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
    setToast({ visible: true, message: 'こどもを追加しました', type: 'success' });
  };

  const handleDeleteStep = async () => {
    if (!confirmDelete) return;
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }
    // Step 2: actually delete
    const child = confirmDelete;
    setConfirmDelete(null);
    setConfirmStep(1);
    setDeletingId(child.childId);
    try {
      await api.deleteChild(child.childId);
      await fetchChildren();
      setToast({ visible: true, message: `${child.name}を削除しました`, type: 'success' });
    } catch {
      setToast({ visible: true, message: '削除に失敗しました', type: 'error' });
    }
    setDeletingId(null);
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
    setConfirmStep(1);
  };

  const handleAvatarClick = (childId: string) => {
    setUploadTargetId(childId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    setCropFile(file);
    setCropTargetId(uploadTargetId);
    e.target.value = '';
  };

  const handleCropped = async (blob: Blob) => {
    if (!cropTargetId) return;
    setUploadingId(cropTargetId);
    setCropFile(null);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await api.uploadAvatar(cropTargetId, file);
      await fetchChildren();
      setToast({ visible: true, message: '写真を変更しました', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'アップロードに失敗しました', type: 'error' });
    }
    setUploadingId(null);
    setCropTargetId(null);
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

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))}
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
                    <button
                      className={styles.avatarTap}
                      onClick={(e) => { e.preventDefault(); handleAvatarClick(child.childId); }}
                      disabled={uploadingId === child.childId}
                      title="写真を変更"
                    >
                      <Avatar
                        avatarIndex={child.avatarIndex}
                        avatarUrl={child.avatarUrl}
                        size="md"
                      />
                      <span className={styles.avatarOverlay}>
                        {uploadingId === child.childId ? '...' : '📷'}
                      </span>
                    </button>
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
                      onClick={(e) => { e.stopPropagation(); setConfirmStep(1); setConfirmDelete(child); }}
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
      <AnimatePresence>
        {cropFile && cropTargetId && (
          <ImageCropModal
            imageFile={cropFile}
            onCropped={handleCropped}
            onCancel={() => { setCropFile(null); setCropTargetId(null); }}
          />
        )}
      </AnimatePresence>
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={handleDeleteCancel}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            {confirmStep === 1 ? (
              <>
                <p className={styles.confirmEmoji}>⚠️</p>
                <p className={styles.confirmText}>
                  「{confirmDelete.name}」を削除しますか？
                </p>
                <p className={styles.confirmSub}>おこづかいの履歴もすべて消えます</p>
                <div className={styles.confirmActions}>
                  <button className={styles.cancelButton} onClick={handleDeleteCancel}>
                    やめる
                  </button>
                  <button className={styles.confirmDeleteBtn} onClick={handleDeleteStep}>
                    削除する
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.confirmEmoji}>🚨</p>
                <p className={styles.confirmText}>
                  本当に削除しますか？
                </p>
                <p className={styles.confirmSub}>この操作は取り消せません</p>
                <div className={styles.confirmActions}>
                  <button className={styles.cancelButton} onClick={handleDeleteCancel}>
                    やっぱりやめる
                  </button>
                  <button className={styles.confirmDeleteBtnFinal} onClick={handleDeleteStep}>
                    はい、削除します
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
