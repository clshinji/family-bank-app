import type { ThemeColor } from '../types';

export interface KidTheme {
  bg: string;
  swatch: string;
  accent: string;
  defaultMood: 'happy' | 'excited' | 'wink';
}

export const THEMES: Record<ThemeColor, KidTheme> = {
  pink: {
    bg: 'linear-gradient(180deg, #FFE4EE 0%, #FFD3E2 60%, #FFBFD4 100%)',
    swatch: '#FFD3E2',
    accent: '#F27CA7',
    defaultMood: 'happy',
  },
  mint: {
    bg: 'linear-gradient(180deg, #D9F5E6 0%, #BDEBD5 60%, #9FDDBE 100%)',
    swatch: '#BDEBD5',
    accent: '#2E9D6E',
    defaultMood: 'excited',
  },
  sun: {
    bg: 'linear-gradient(180deg, #FFF6D4 0%, #FFE79C 60%, #FFD56B 100%)',
    swatch: '#FFE79C',
    accent: '#F5C849',
    defaultMood: 'happy',
  },
  lavender: {
    bg: 'linear-gradient(180deg, #ECE2FF 0%, #D9CCF5 60%, #BFA9F0 100%)',
    swatch: '#D9CCF5',
    accent: '#6B4FB3',
    defaultMood: 'wink',
  },
};

export function themeOf(color: ThemeColor | undefined): KidTheme {
  return THEMES[color ?? 'pink'] ?? THEMES.pink;
}

export const COLOR_LABELS: Record<ThemeColor, string> = {
  pink: 'ピンク',
  mint: 'ミント',
  sun: 'サン',
  lavender: 'ラベンダー',
};
