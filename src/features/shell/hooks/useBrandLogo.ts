import { useState } from 'react'
import { useBranding } from '../../../store'

export interface BrandLogoState {
  src: string
  name: string
  /** True when there is no logo or it failed to load: show the gym name instead. */
  showText: boolean
  onError: () => void
}

export function useBrandLogo(): BrandLogoState {
  const { logoUrl, gymName } = useBranding()
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return {
    src: logoUrl,
    name: gymName,
    showText: !logoUrl || failedUrl === logoUrl,
    onError: () => setFailedUrl(logoUrl),
  }
}
