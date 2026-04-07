import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion } from 'framer-motion';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
  imageFile: File;
  onCropped: (blob: Blob) => void;
  onCancel: () => void;
}

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const size = 400;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}

export function ImageCropModal({ imageFile, onCropped, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc] = useState(() => URL.createObjectURL(imageFile));
  const [saving, setSaving] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const minSide = Math.min(width, height);
    const x = (width - minSide) / 2;
    const y = (height - minSide) / 2;
    setCrop({ unit: 'px', x, y, width: minSide, height: minSide });
  }, []);

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);
    const blob = await getCroppedBlob(imgRef.current, completedCrop);
    onCropped(blob);
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className={styles.title}>写真をトリミング</h2>
        <p className={styles.hint}>ドラッグで範囲を調整できます</p>

        <div className={styles.cropArea}>
          <ReactCrop
            crop={crop}
            onChange={setCrop}
            onComplete={setCompletedCrop}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="crop"
              className={styles.cropImage}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            やめる
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!completedCrop || saving}
          >
            {saving ? '保存中...' : 'この範囲で保存'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
