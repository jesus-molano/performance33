import { useEffect } from 'react'
import { applyBrandingToDocument } from '../lib/branding'
import type { Branding } from '../types'

/** Keeps the brand CSS variables (and favicon/title) in sync with Ajustes → Marca. */
export function useBrandingStyles(branding: Branding): void {
  useEffect(() => {
    applyBrandingToDocument(branding)
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon && branding.iconUrl) favicon.href = branding.iconUrl
    document.title = `${branding.gymName} · Rutinas`
  }, [branding])
}
