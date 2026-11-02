import { DEFAULT_BRANDING } from '@/config/branding'
import { useBrandingStyles, useDisplayData } from '@/hooks'
import type { Branding, DisplayData } from '@/types'
import { getDisplayTheme, type DisplayThemeClasses } from '@/features/display/utils/theme'

export interface ScreenData {
  /** Sanitised live data (no private fields), null if nothing has been saved yet. */
  data: DisplayData | null
  branding: Branding
  theme: DisplayThemeClasses
}

/** Data source for TV windows: live sanitised data + branding applied to the document. `title` names the browser tab. */
export function useScreenData(title?: string): ScreenData {
  const { data } = useDisplayData()
  const branding = data?.branding ?? DEFAULT_BRANDING
  useBrandingStyles(branding, title)
  return { data, branding, theme: getDisplayTheme(branding.displayTheme) }
}
