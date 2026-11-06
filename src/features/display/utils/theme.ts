import type { DisplayTheme } from '@/types'

/** Class families for the branded screen (read from 3-4 m). Dark = black + brand pink; light = off-white canvas, white block cards. */
export interface DisplayThemeClasses {
  root: string
  card: string
  mutedCard: string
  /** Full-width header band of a main block, and the quieter one of warm-up/mobility. */
  blockBand: string
  mutedBlockBand: string
  /** Block tile in the band: the letter of A1/A2 (same colours as the row labels), or the icon of a warm-up. */
  blockLetter: string
  mutedBlockLetter: string
  /** Type and rest pill on the right of the band. */
  bandChip: string
  accentText: string
  accentBorder: string
  badge: string
  outlineBadge: string
  secondaryText: string
  subtleText: string
  noteSurface: string
  rowDivider: string
  /** Gutter between the sections of a TV, so each person's part reads as its own. */
  sectionGutter: string
  /** Divider between the two parts of a split screen. */
  splitDivider: string
  logoWrap: string
  overlay: string
}

const DARK: DisplayThemeClasses = {
  root: 'bg-ink text-white',
  card: 'bg-ink-soft border border-ink-line',
  mutedCard: 'border border-dashed border-ink-line',
  blockBand: 'bg-white/10 text-white',
  mutedBlockBand: 'bg-white/5 text-zinc-200',
  blockLetter: 'bg-brand-on-dark text-brand-on-dark-contrast',
  mutedBlockLetter: 'bg-white/10 text-zinc-200',
  bandChip: 'bg-brand-on-dark text-brand-on-dark-contrast',
  accentText: 'text-brand-on-dark',
  accentBorder: 'border-brand-on-dark',
  badge: 'bg-brand-on-dark text-brand-on-dark-contrast',
  outlineBadge: 'border border-brand-on-dark/60 text-brand-on-dark',
  secondaryText: 'text-zinc-200',
  subtleText: 'text-zinc-300',
  noteSurface: 'bg-white/5',
  rowDivider: 'divide-white/15',
  sectionGutter: 'bg-brand/40',
  splitDivider: '[column-rule-color:var(--color-brand-on-dark)]',
  logoWrap: '',
  overlay: 'bg-black/80 text-white border border-white/15 backdrop-blur',
}

const LIGHT: DisplayThemeClasses = {
  root: 'bg-tv-canvas text-tv-ink',
  card: 'bg-tv-card border-2 border-tv-line',
  mutedCard: 'bg-tv-card border-2 border-tv-line',
  blockBand: 'bg-tv-band text-white',
  mutedBlockBand: 'bg-tv-band-soft text-tv-ink',
  blockLetter: 'bg-tv-accent text-tv-accent-contrast',
  mutedBlockLetter: 'bg-tv-card text-tv-text-2',
  bandChip: 'bg-tv-card text-tv-ink',
  accentText: 'text-tv-accent',
  accentBorder: 'border-tv-accent',
  badge: 'bg-tv-accent text-tv-accent-contrast',
  outlineBadge: 'border-2 border-tv-accent text-tv-accent',
  secondaryText: 'text-tv-text-2',
  subtleText: 'text-tv-text-3',
  noteSurface: 'bg-tv-canvas',
  rowDivider: 'divide-tv-line',
  sectionGutter: 'bg-tv-gutter',
  splitDivider: '[column-rule-color:var(--color-tv-line)]',
  logoWrap: 'bg-ink rounded-[0.6em] px-[0.7em] py-[0.4em]',
  overlay: 'bg-white/90 text-fg border border-line shadow-pop backdrop-blur',
}

export function getDisplayTheme(theme: DisplayTheme): DisplayThemeClasses {
  return theme === 'light' ? LIGHT : DARK
}
