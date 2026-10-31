import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Branding } from '@/types'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DisplayLogo } from '@/features/display/components/routine/DisplayLogo'

interface ScreenMessageProps {
  branding: Branding
  theme: DisplayThemeClasses
  icon: LucideIcon
  title: string
  description?: ReactNode
  /** Bigger client name above the title, e.g. 'Lucía'. */
  name?: string | null
}

/** Branded empty state for a TV window or a TV third ('Sin rutina asignada'…). */
export function ScreenMessage({ branding, theme, icon: Icon, title, description, name }: ScreenMessageProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-8 text-center [container-type:inline-size]">
      <DisplayLogo branding={branding} theme={theme} className="h-14 sm:h-16" />
      <Icon aria-hidden className={cn('mt-6 size-14', theme.accentText)} />
      {name && <p className="text-[clamp(2rem,9cqi,4rem)] leading-none font-extrabold tracking-tight">{name}</p>}
      <div className="max-w-md space-y-2">
        <h1 className="text-[clamp(1.5rem,6cqi,2.5rem)] leading-tight font-bold">{title}</h1>
        {description && <p className={cn('text-lg', theme.secondaryText)}>{description}</p>}
      </div>
    </div>
  )
}
