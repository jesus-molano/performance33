import { Maximize, Minimize } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { OverlayButton } from './OverlayButton'

interface ScreenToolbarProps {
  theme: DisplayThemeClasses
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onBigger: () => void
  onSmaller: () => void
  /** Extra controls on the left (day switcher, TV column count). */
  children?: ReactNode
}

/** Pill with [extra] · A- A+ · full screen. */
export function ScreenToolbar({ theme, isFullscreen, onToggleFullscreen, onBigger, onSmaller, children }: ScreenToolbarProps) {
  return (
    <div className={cn('flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-1 rounded-3xl p-1 shadow-pop md:flex-nowrap md:rounded-full', theme.overlay)}>
      {children}
      {children && <span aria-hidden className="mx-1 hidden h-6 w-px bg-current/20 md:block" />}
      <OverlayButton label="Texto más pequeño (−)" onClick={onSmaller}>
        <span className="text-sm">A−</span>
      </OverlayButton>
      <OverlayButton label="Texto más grande (+)" onClick={onBigger}>
        <span className="text-xl">A+</span>
      </OverlayButton>
      <OverlayButton
        label={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
        icon={isFullscreen ? Minimize : Maximize}
        onClick={onToggleFullscreen}
      />
    </div>
  )
}
