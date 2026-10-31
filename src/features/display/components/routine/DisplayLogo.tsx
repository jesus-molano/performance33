import type { Branding } from '../../../../types'
import type { DisplayThemeClasses } from '../../utils/theme'

interface DisplayLogoProps {
  branding: Branding
  theme: DisplayThemeClasses
  className?: string
}

/** Gym logo (made for dark backgrounds: wrapped in a black pill on the light theme), or the gym name. */
export function DisplayLogo({ branding, theme, className = 'h-[2.4em]' }: DisplayLogoProps) {
  if (!branding.logoUrl) {
    return <span className={`text-[1.6em] font-bold tracking-tight ${theme.accentText}`}>{branding.gymName}</span>
  }
  return (
    <span className={`inline-flex min-w-0 ${theme.logoWrap}`}>
      <img src={branding.logoUrl} alt={branding.gymName} className={`${className} w-auto max-w-full object-contain`} />
    </span>
  )
}
