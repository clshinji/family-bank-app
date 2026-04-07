import styles from './Avatar.module.css';

const AVATARS = ['🐱', '🐶', '🐰', '🐼', '🦊', '🐸'];

interface AvatarProps {
  avatarIndex: number;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ avatarIndex, avatarUrl, size = 'md', className }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className={`${styles.image} ${styles[size]} ${className ?? ''}`}
      />
    );
  }
  return (
    <span className={`${styles.emoji} ${styles[size]} ${className ?? ''}`}>
      {AVATARS[avatarIndex] ?? '🐱'}
    </span>
  );
}

export { AVATARS };
