import { DISPLAY_DARK_BACKGROUND, MIN_TEXT_CONTRAST } from '@/config/contrast'
import type { Branding } from '@/types'
import { ensureContrast, isHexColor, readableTextOn } from './color'

/**
 * CSS custom properties derived from branding (consumed by the Tailwind theme tokens).
 * --color-brand-on-dark is the primary colour lightened as needed to stay readable on the black TV.
 */
export function brandingCssVars(branding: Branding): Record<string, string> {
  const vars: Record<string, string> = {}
  if (isHexColor(branding.primaryColor)) {
    vars['--color-brand'] = branding.primaryColor
    vars['--color-brand-contrast'] = readableTextOn(branding.primaryColor)
    const onDark = ensureContrast(branding.primaryColor, DISPLAY_DARK_BACKGROUND, MIN_TEXT_CONTRAST)
    vars['--color-brand-on-dark'] = onDark
    vars['--color-brand-on-dark-contrast'] = readableTextOn(onDark)
  }
  if (isHexColor(branding.accentColor)) {
    vars['--color-brand-strong'] = branding.accentColor
    vars['--color-brand-strong-contrast'] = readableTextOn(branding.accentColor)
  }
  return vars
}

/** Push branding colours into CSS variables on <html> so every brand token follows Ajustes. */
export function applyBrandingToDocument(branding: Branding): void {
  const root = document.documentElement
  for (const [name, value] of Object.entries(brandingCssVars(branding))) {
    root.style.setProperty(name, value)
  }
}
