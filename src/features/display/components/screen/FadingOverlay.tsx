import type { ReactNode } from 'react'
import { cn } from '../../../../lib/cn'

interface FadingOverlayProps {
  visible: boolean
  /** Tailwind position classes, e.g. 'inset-x-0 bottom-6 justify-center'. */
  position: string
  /** Stretch the content to the overlay width. */
  fill?: boolean
  children: ReactNode
}

/** Absolutely positioned layer that fades out (and stops catching clicks) when hidden. */
export function FadingOverlay({ visible, position, fill = false, children }: FadingOverlayProps) {
  return (
    <div
      aria-hidden={!visible}
      onDoubleClick={(event) => event.stopPropagation()}
      className={cn(
        'pointer-events-none absolute z-10 flex px-3 transition-opacity duration-500',
        position,
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className={cn(fill && 'w-full', visible && 'pointer-events-auto')}>{children}</div>
    </div>
  )
}
