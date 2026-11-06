import { describe, expect, it } from 'vitest'
import { DEFAULT_BRANDING } from '@/config/branding'
import { MIN_TV_TEXT_CONTRAST, WHITE } from '@/config/contrast'
import { brandingCssVars } from './branding'
import { contrastRatio } from './color'

describe('brandingCssVars', () => {
  it('darkens the TV accent to 7:1 on white, with readable text on it', () => {
    const vars = brandingCssVars({ ...DEFAULT_BRANDING, accentColor: '#f79cce' })
    expect(contrastRatio(vars['--color-tv-accent'], WHITE)).toBeGreaterThanOrEqual(MIN_TV_TEXT_CONTRAST)
    expect(vars['--color-tv-accent-contrast']).toBe('#ffffff')
  })

  it('keeps an accent that already reads well', () => {
    expect(brandingCssVars({ ...DEFAULT_BRANDING, accentColor: '#111111' })['--color-tv-accent']).toBe('#111111')
  })

  it('the default accent matches the CSS fallback', () => {
    expect(brandingCssVars(DEFAULT_BRANDING)['--color-tv-accent']).toBe('#932062')
  })
})
