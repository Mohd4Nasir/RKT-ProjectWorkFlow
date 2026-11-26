/**
 * Colour themes. The real values live in index.css as
 * `:root[data-theme='<id>']` blocks - this list is only for the picker UI
 * (swatch colours are the same HSL numbers, kept in sync by hand).
 */
export interface ColorTheme {
  id: string;
  label: string;
  /** "h s% l%" triplets, used for the swatch preview only */
  sidebar: string;
  primary: string;
  canvas: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  { id: 'classic', label: 'Classic', sidebar: '229 41% 17%', primary: '337 70% 50%', canvas: '224 70% 98%' },
  { id: 'ocean', label: 'Ocean', sidebar: '215 55% 16%', primary: '214 90% 42%', canvas: '210 100% 97%' },
  { id: 'emerald', label: 'Emerald', sidebar: '165 50% 12%', primary: '162 85% 28%', canvas: '150 45% 96%' },
  { id: 'violet', label: 'Violet', sidebar: '258 45% 17%', primary: '262 72% 52%', canvas: '262 60% 97%' },
  { id: 'rose', label: 'Rose', sidebar: '340 38% 15%', primary: '346 80% 46%', canvas: '340 55% 97%' },
  { id: 'slate', label: 'Slate', sidebar: '222 30% 13%', primary: '222 47% 28%', canvas: '220 16% 96%' },
];

export const DEFAULT_COLOR_THEME = 'classic';
