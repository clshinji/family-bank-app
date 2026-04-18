import { useState } from 'react';
import { DECO_CATALOG, type DecoCategory, renderDeco } from './decorations';
import styles from './DecoTray.module.css';

interface DecoTrayProps {
  deco: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

const CATEGORIES: { id: DecoCategory; name: string }[] = [
  { id: 'hat', name: 'ぼうし' },
  { id: 'face', name: 'めがね' },
  { id: 'neck', name: 'くび' },
  { id: 'sticker', name: 'シール' },
];

export function DecoTray({ deco, onToggle, onClear }: DecoTrayProps) {
  const [cat, setCat] = useState<DecoCategory>('hat');
  const items = Object.entries(DECO_CATALOG).filter(([, m]) => m.cat === cat);

  return (
    <div className={styles.tray}>
      <div className={styles.header}>
        <span className={styles.title}>✨ すきにデコろう!</span>
        <button type="button" className={styles.clearBtn} onClick={onClear}>
          ぜんぶとる
        </button>
      </div>

      <div className={styles.tabs}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            className={`${styles.tab} ${cat === c.id ? styles.tabActive : ''}`}
            onClick={() => setCat(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {items.map(([id, meta]) => {
          const on = deco.includes(id);
          return (
            <button
              key={id}
              type="button"
              className={`${styles.item} ${on ? styles.itemOn : ''}`}
              onClick={() => onToggle(id)}
              aria-pressed={on}
            >
              <svg viewBox="0 0 248 220" className={styles.preview}>
                <g transform="translate(0 10)">{renderDeco([id])}</g>
              </svg>
              {on && <span className={styles.check}>✓</span>}
              <span className={styles.label}>{meta.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
