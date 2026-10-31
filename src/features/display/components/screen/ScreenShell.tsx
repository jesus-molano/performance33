import type { ReactNode } from 'react'
import { cn } from '../../../../lib/cn'
import type { DisplayThemeClasses } from '../../utils/theme'

interface ScreenShellProps {
  theme: DisplayThemeClasses
  /** Hides the cursor while controls are hidden (clean TV image). */
  idle: boolean
  onToggleFullscreen: () => void
  className?: string
  children: ReactNode
}

/** Full-window, chrome-less canvas for TV windows. Double click toggles full screen. */
export function ScreenShell({ theme, idle, onToggleFullscreen, className, children }: ScreenShellProps) {
  return (
    <main
      onDoubleClick={onToggleFullscreen}
      className={cn('fixed inset-0 overflow-hidden font-sans select-none', theme.root, idle && 'cursor-none', className)}
    >
      {children}
    </main>
  )
}
