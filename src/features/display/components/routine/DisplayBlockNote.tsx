import { MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface DisplayBlockNoteProps {
  note: string
  /** Density-specific spacing and size. */
  className: string
  theme: DisplayThemeClasses
}

/** Client-visible block note ('Ritmo constante…') with a speech icon; hides when the day needs the room. */
export function DisplayBlockNote({ note, className, theme }: DisplayBlockNoteProps) {
  return (
    <p className={cn('items-start font-medium [display:var(--display-note,flex)]', className, theme.noteSurface, theme.secondaryText)}>
      <MessageSquareText size="1em" aria-hidden className={cn('mt-[0.2em] shrink-0 [display:var(--display-extra,block)]', theme.accentText)} />
      <span className="min-w-0 [overflow-wrap:anywhere]">{note}</span>
    </p>
  )
}
