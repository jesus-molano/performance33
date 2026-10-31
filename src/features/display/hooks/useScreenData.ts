import { DEFAULT_BRANDING } from '../../../config/branding'
import { useBrandingStyles } from '../../../hooks/useBrandingStyles'
import { useDisplayData } from '../../../hooks/useDisplayData'
import type { Branding, DisplayData } from '../../../types'
import { getDisplayTheme, type DisplayThemeClasses } from '../utils/theme'

export interface ScreenData {
  /** Sanitised live data (no private fields), null if nothing has been saved yet. */
  data: DisplayData | null
  branding: Branding
  theme: DisplayThemeClasses
}

/** Data source for TV windows: live sanitised data + branding applied to the document. */
export function useScreenData(): ScreenData {
  const { data } = useDisplayData()
  const branding = data?.branding ?? DEFAULT_BRANDING
  useBrandingStyles(branding)
  return { data, branding, theme: getDisplayTheme(branding.displayTheme) }
}
