// Brand colours (same as the coaches' web), sizes and spacing. No colour or size is written anywhere else.

export const COLORS = {
  black: '#000000',
  white: '#ffffff',
  /** Main brand pink, for dark backgrounds. */
  pink: '#f79cce',
  /** Darker brand colour readable on white: buttons, links, the selected tab. */
  accent: '#b8287a',
  accentSoft: '#fbe3f0',
  text: '#18181b',
  textMuted: '#52525b',
  border: '#e4e4e7',
  surface: '#f4f4f5',
  background: '#ffffff',
  success: '#15803d',
  successSoft: '#dcfce7',
  warning: '#a16207',
  warningSoft: '#fef3c7',
  danger: '#b91c1c',
  dangerSoft: '#fee2e2',
} as const

/** Every button, tab and row someone taps is at least this tall (and wide). */
export const TOUCH_SIZE = 48

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 } as const

/** Big type: many members read without glasses, mid-workout. */
export const FONT = {
  small: 15,
  body: 17,
  large: 20,
  title: 24,
  hero: 30,
} as const

/** Screens never grow wider than this (tablets and the web on a laptop). */
export const MAX_CONTENT_WIDTH = 560
