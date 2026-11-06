import type { Branding } from '@/types'

/**
 * Version of the TV theme default. Data saved before it (no version) moves to the light theme once;
 * a theme chosen afterwards in Ajustes is saved with this version and kept.
 */
export const LIGHT_DISPLAY_THEME_VERSION = 1

export const DEFAULT_BRANDING: Branding = {
  gymName: 'Performance33',
  tagline: 'Mejora tu rendimiento, transforma tus hábitos',
  logoUrl: '/brand/logo.png',
  iconUrl: '/brand/icon.jpg',
  primaryColor: '#f79cce',
  accentColor: '#b8287a',
  displayTheme: 'light',
  displayThemeVersion: LIGHT_DISPLAY_THEME_VERSION,
}

/** Accent default of earlier versions (too little contrast on white): migrated to the new default. */
export const LEGACY_ACCENT_COLOR = '#d6449a'

/** Max size for an uploaded logo/icon (stored as a data URL in localStorage). */
export const MAX_LOGO_BYTES = 1_500_000
