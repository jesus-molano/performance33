import { Laptop, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { TV_WINDOWS_COPY } from '@/features/screens/config/tvWindows'
import { useTvWindowsControl } from '@/features/screens/hooks/useTvWindowsControl'

export interface TvWindowsActionsProps {
  /** Runs before the order (the Pantallas menu closes itself). */
  onDone?: () => void
  className?: string
}

/** 'Traer todas' / 'Cerrar todas': only while a TV window is open in this browser. */
export function TvWindowsActions({ onDone, className }: TvWindowsActionsProps) {
  const control = useTvWindowsControl()
  if (!control.visible) return null
  const run = (action: () => void) => () => {
    onDone?.()
    action()
  }
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button variant="secondary" size="sm" leftIcon={Laptop} aria-label={TV_WINDOWS_COPY.bringAllLabel} onClick={run(control.bringAll)}>
        {TV_WINDOWS_COPY.bringAll}
      </Button>
      <Button variant="secondary" size="sm" leftIcon={X} aria-label={TV_WINDOWS_COPY.closeAllLabel} onClick={run(control.closeAll)}>
        {TV_WINDOWS_COPY.closeAll}
      </Button>
    </div>
  )
}
