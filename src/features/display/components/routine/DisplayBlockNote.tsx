import { MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface DisplayBlockNoteProps {
  note: string
  /** Density-specific spacing and size. */
  className: string
  theme: DisplayThemeClasses
}

/** Client-visible block note ('Ritmo constante…') with a speech icon. */
export function DisplayBlockNote({ note, className, theme }: DisplayBlockNoteProps) {
  return (
    <p className={cn('flex items-start', className, theme.noteSurface, theme.secondaryText)}>
      <MessageSquareText size="1em" aria-hidden className={cn('mt-[0.2em] shrink-0', theme.accentText)} />
      <span className="min-w-0 [overflow-wrap:anywhere]">{note}</span>
    </p>
  )
}
