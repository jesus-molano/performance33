import type { Branding } from '@/types'

export const DEFAULT_BRANDING: Branding = {
  gymName: 'Performance33',
  tagline: 'Mejora tu rendimiento, transforma tus hábitos',
  logoUrl: '/brand/logo.png',
  iconUrl: '/brand/icon.jpg',
  primaryColor: '#f79cce',
  accentColor: '#b8287a',
  displayTheme: 'dark',
}

/** Accent default of earlier versions (too little contrast on white): migrated to the new default. */
export const LEGACY_ACCENT_COLOR = '#d6449a'

/** Max size for an uploaded logo/icon (stored as a data URL in localStorage). */
export const MAX_LOGO_BYTES = 1_500_000
