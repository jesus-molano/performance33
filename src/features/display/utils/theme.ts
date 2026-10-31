import type { DisplayTheme } from '@/types'

/** Class families for the branded screen (read from 3-4 m). Dark = black + brand pink; light = white cards + brand-strong. */
export interface DisplayThemeClasses {
  root: string
  card: string
  mutedCard: string
  accentText: string
  accentBorder: string
  badge: string
  outlineBadge: string
  secondaryText: string
  subtleText: string
  noteSurface: string
  rowDivider: string
  columnDivider: string
  logoWrap: string
  overlay: string
}

const DARK: DisplayThemeClasses = {
  root: 'bg-ink text-white',
  card: 'bg-ink-soft border border-ink-line',
  mutedCard: 'border border-dashed border-ink-line',
  accentText: 'text-brand-on-dark',
  accentBorder: 'border-brand-on-dark',
  badge: 'bg-brand-on-dark text-brand-on-dark-contrast',
  outlineBadge: 'border border-brand-on-dark/60 text-brand-on-dark',
  secondaryText: 'text-zinc-300',
  subtleText: 'text-zinc-400',
  noteSurface: 'bg-white/5',
  rowDivider: 'divide-white/10',
  columnDivider: 'divide-brand/40',
  logoWrap: '',
  overlay: 'bg-black/80 text-white border border-white/15 backdrop-blur',
}

const LIGHT: DisplayThemeClasses = {
  root: 'bg-canvas text-fg',
  card: 'bg-white border border-line-strong',
  mutedCard: 'border border-dashed border-line-strong',
  accentText: 'text-brand-strong',
  accentBorder: 'border-brand-strong',
  badge: 'bg-brand-strong text-brand-strong-contrast',
  outlineBadge: 'border border-brand-strong/60 text-brand-strong',
  secondaryText: 'text-fg',
  subtleText: 'text-fg-muted',
  noteSurface: 'bg-brand-soft',
  rowDivider: 'divide-line',
  columnDivider: 'divide-brand-strong/30',
  logoWrap: 'bg-ink rounded-[0.6em] px-[0.7em] py-[0.4em]',
  overlay: 'bg-white/90 text-fg border border-line shadow-pop backdrop-blur',
}

export function getDisplayTheme(theme: DisplayTheme): DisplayThemeClasses {
  return theme === 'light' ? LIGHT : DARK
}
