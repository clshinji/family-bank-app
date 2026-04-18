import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Child, ThemeColor } from '../types';
import { PigMascot } from '../components/PigMascot';
import { THEMES } from '../components/theme';
import { ShareModal } from '../components/ShareModal';
import { ImageCropModal } from '../components/ImageCropModal';
import { Toast } from '../components/Toast';
import styles from './ParentDashboard.module.css';

const COLORS: { id: ThemeColor; label: string }[] = [
  { id: 'pink', label: 'ピンク' },
  { id: 'mint', label: 'ミント' },
  { id: 'sun', label: 'サン' },
  { id: 'lavender', label: 'ラベンダー' },
];

function todayLabel() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function ParentDashboard() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editKid, setEditKid] = useState<Child | null>(null);
  const [confirmDel, setConfirmDel] = useState<Child | null>(null);
  const [delStep, setDelStep] = useState<1 | 2>(1);
  const [shareKid, setShareKid] = useState<Child | null>(null);

  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const fetchChildren = async () => {
    const res = await api.listChildren();
    setChildren(res.children);
  };

  useEffect(() => {
    fetchChildren().finally(() => setLoading(false));
  }, []);

  const handleAvatarTap = (childId: string) => {
    setUploadTargetId(childId);
    fileInputRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadTargetId) return;
    setCropFile(file);
  };

  const handleCropped = async (blob: Blob) => {
    if (!uploadTargetId) return;
    const childId = uploadTargetId;
    setUploadingId(childId);
    setCropFile(null);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await api.uploadAvatar(childId, file);
      await fetchChildren();
      setToast({ visible: true, message: '写真を変更しました', type: 'success' });
    } catch {
      setToast({ visible: true, message: 'アップロードに失敗しました', type: 'error' });
    }
    setUploadingId(null);
    setUploadTargetId(null);
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    if (delStep === 1) {
      setDelStep(2);
      return;
    }
    const target = confirmDel;
    setConfirmDel(null);
    setDelStep(1);
    try {
      await api.deleteChild(target.childId);
      await fetchChildren();
      setToast({ visible: true, message: `${target.name}を削除しました`, type: 'success' });
    } catch {
      setToast({ visible: true, message: '削除に失敗しました', type: 'error' });
    }
  };

  const total = children.reduce((a, k) => a + k.balance, 0);

  return (
    <div className={styles.screen}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.hiddenInput}
        onChange={handleFile}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))}
      />

      <header className={styles.header}>
        <span className={styles.eyebrow}>おこづかいちょう</span>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>ダッシュボード</h1>
          <span className={styles.dateTag}>{todayLabel()}</span>
        </div>
      </header>

      <section className={styles.totalCard}>
        <div className={styles.totalLeft}>
          <span className={styles.totalLabel}>TOTAL BALANCE</span>
          <span className={styles.totalValue}>¥{total.toLocaleString()}</span>
          <span className={styles.totalSub}>{children.length}にんのこ</span>
        </div>
        <div className={styles.totalAvatars}>
          {children.slice(0, 3).map((k, i) => (
            <span
              key={k.childId}
              className={styles.totalChip}
              style={{
                background: THEMES[k.color ?? 'pink'].swatch,
                marginLeft: i === 0 ? 0 : -10,
                zIndex: 3 - i,
              }}
            >
              {k.name.slice(0, 1)}
            </span>
          ))}
        </div>
      </section>

      <div className={styles.sectionLabel}>
        <span>こども</span>
        <button type="button" className={styles.addLink} onClick={() => setShowAdd(true)}>
          ＋ ついか
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingArea}>
          <PigMascot size={120} mood="sleepy" />
        </div>
      ) : children.length === 0 ? (
        <div className={styles.emptyCard}>
          <PigMascot size={120} bounce={false} />
          <p>まだ こどもが とうろくされていません</p>
        </div>
      ) : (
        <div className={styles.kidList}>
          {children.map(k => {
            const swatch = THEMES[k.color ?? 'pink'].swatch;
            const colorLabel = COLORS.find(c => c.id === (k.color ?? 'pink'))?.label;
            return (
              <article key={k.childId} className={styles.kidCard}>
                <button
                  type="button"
                  className={styles.kidAvatar}
                  style={{ background: swatch }}
                  onClick={() => handleAvatarTap(k.childId)}
                  disabled={uploadingId === k.childId}
                  aria-label={`${k.name}のアバターを変更`}
                >
                  <PigMascot
                    size={52}
                    bounce={false}
                    deco={k.deco}
                    photoUrl={k.avatarUrl}
                  />
                  <span className={styles.avatarOverlay}>
                    {uploadingId === k.childId ? '…' : '📷'}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.kidBody}
                  onClick={() => navigate(`/parent/${k.childId}`)}
                  aria-label={`${k.name}のそうさ画面へ`}
                >
                  <span className={styles.kidName}>{k.name}</span>
                  <span className={styles.kidMeta}>{colorLabel}テーマ</span>
                  <span
                    className={`${styles.kidBalance} ${k.balance < 0 ? styles.kidBalanceNeg : ''}`}
                  >
                    ¥{k.balance.toLocaleString()}
                  </span>
                </button>
                <div className={styles.kidActions}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => navigate(`/parent/${k.childId}`)}
                  >
                    そうさ
                  </button>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={() => setShareKid(k)}
                  >
                    QR
                  </button>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={() => setEditKid(k)}
                  >
                    ✎ へんこう
                  </button>
                  <button
                    type="button"
                    className={styles.btnText}
                    onClick={() => {
                      setDelStep(1);
                      setConfirmDel(k);
                    }}
                  >
                    さくじょ
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <button type="button" className={styles.dashedAdd} onClick={() => setShowAdd(true)}>
        ＋ あたらしいこを ついか
      </button>

      {showAdd && (
        <KidFormModal
          mode="add"
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            await fetchChildren();
            setToast({ visible: true, message: 'こどもを追加しました', type: 'success' });
          }}
        />
      )}

      {editKid && (
        <KidFormModal
          mode="edit"
          initial={editKid}
          onClose={() => setEditKid(null)}
          onSaved={async () => {
            setEditKid(null);
            await fetchChildren();
            setToast({ visible: true, message: 'へんこうを保存しました', type: 'success' });
          }}
        />
      )}

      {confirmDel && (
        <ConfirmModal
          step={delStep}
          name={confirmDel.name}
          onCancel={() => {
            setConfirmDel(null);
            setDelStep(1);
          }}
          onConfirm={handleDelete}
        />
      )}

      {shareKid && (
        <ShareModal child={shareKid} onClose={() => setShareKid(null)} />
      )}

      {cropFile && uploadTargetId && (
        <ImageCropModal
          imageFile={cropFile}
          onCropped={handleCropped}
          onCancel={() => {
            setCropFile(null);
            setUploadTargetId(null);
          }}
        />
      )}
    </div>
  );
}

interface KidFormModalProps {
  mode: 'add' | 'edit';
  initial?: Child;
  onClose: () => void;
  onSaved: () => void;
}

function KidFormModal({ mode, initial, onClose, onSaved }: KidFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState<ThemeColor>(initial?.color ?? 'pink');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'add') {
        await api.createChild({ name: name.trim(), color, deco: [] });
      } else if (initial) {
        await api.updateChild(initial.childId, { name: name.trim(), color });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`pop-in ${styles.modalSheet}`} onClick={e => e.stopPropagation()}>
        <span className={styles.modalGrip} />
        <h2 className={styles.modalTitle}>
          {mode === 'add' ? 'こどもをついか' : 'こどもじょうほうをへんこう'}
        </h2>
        <p className={styles.modalLead}>
          {mode === 'add' ? 'なまえとテーマカラーをえらんでください' : 'なまえとテーマカラーをかえられます'}
        </p>

        <label className={styles.formLabel}>なまえ</label>
        <input
          className={styles.formInput}
          type="text"
          placeholder="れい: はなちゃん"
          value={name}
          maxLength={20}
          onChange={e => setName(e.target.value)}
        />

        <label className={styles.formLabel}>テーマカラー</label>
        <div className={styles.swatchRow}>
          {COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              className={`${styles.swatch} ${color === c.id ? styles.swatchSelected : ''}`}
              style={{ background: THEMES[c.id].swatch }}
              onClick={() => setColor(c.id)}
              aria-label={c.label}
            />
          ))}
        </div>

        {error && <p className={styles.formError}>{error}</p>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhostWide} onClick={onClose}>
            キャンセル
          </button>
          <button
            type="button"
            className={styles.btnPrimaryWide}
            onClick={submit}
            disabled={!name.trim() || submitting}
          >
            {submitting ? '保存中…' : mode === 'add' ? 'ついか ✓' : '保存 ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  step: 1 | 2;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ step, name, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={`pop-in ${styles.modalSheet}`} onClick={e => e.stopPropagation()}>
        <span className={styles.modalGrip} />
        {step === 1 ? (
          <>
            <h2 className={styles.modalTitle}>{name}をさくじょ?</h2>
            <p className={styles.modalLead}>
              りれきとざんだかも すべてきえます。
              <br />
              このそうさは もとにもどせません。
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhostWide} onClick={onCancel}>
                キャンセル
              </button>
              <button
                type="button"
                className={`${styles.btnPrimaryWide} ${styles.btnDanger}`}
                onClick={onConfirm}
              >
                さくじょ
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.modalTitle}>ほんとうに けしますか?</h2>
            <p className={styles.modalLead}>このそうさは もとにもどせません。</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhostWide} onClick={onCancel}>
                やっぱり やめる
              </button>
              <button
                type="button"
                className={`${styles.btnPrimaryWide} ${styles.btnDanger}`}
                onClick={onConfirm}
              >
                はい、けします
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
