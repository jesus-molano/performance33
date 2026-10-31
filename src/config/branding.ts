import type { Branding } from '../types'

export const DEFAULT_BRANDING: Branding = {
  gymName: 'Performance33',
  tagline: 'Mejora tu rendimiento, transforma tus hábitos',
  logoUrl: '/brand/logo.png',
  iconUrl: '/brand/icon.jpg',
  primaryColor: '#f79cce',
  accentColor: '#d6449a',
  displayTheme: 'dark',
}

/** Max size for an uploaded logo/icon (stored as a data URL in localStorage). */
export const MAX_LOGO_BYTES = 1_500_000
