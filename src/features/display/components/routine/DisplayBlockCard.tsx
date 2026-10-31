import { MessageSquareText, Repeat } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DisplayBlockHeader } from './DisplayBlockHeader'
import { DisplayExerciseList } from './DisplayExerciseList'

interface DisplayBlockCardProps {
  block: DisplayBlock
  week: number | null
  theme: DisplayThemeClasses
  flashing: boolean
}

/** One block: type header, free text (warm-up), exercise rows, client-visible note and footer. */
export function DisplayBlockCard({ block, week, theme, flashing }: DisplayBlockCardProps) {
  return (
    <article
      className={cn(
        'mb-[0.9em] break-inside-avoid rounded-[0.9em] px-[1em] py-[0.85em]',
        block.muted ? theme.mutedCard : theme.card,
        flashing && 'animate-flash',
      )}
    >
      <DisplayBlockHeader block={block} theme={theme} flashing={flashing} />
      {block.text && (
        <p className={cn('mt-[0.5em] text-[1.4em] leading-snug whitespace-pre-line [overflow-wrap:anywhere]', theme.secondaryText)}>
          {block.text}
        </p>
      )}
      {block.exercises.length > 0 && (
        <DisplayExerciseList block={block} week={week} theme={theme} />
      )}
      {block.note && (
        <p
          className={cn(
            'mt-[0.5em] flex items-start gap-[0.5em] rounded-[0.6em] px-[0.7em] py-[0.45em] text-[1.3em] leading-snug',
            theme.noteSurface,
            theme.secondaryText,
          )}
        >
          <MessageSquareText size="1em" aria-hidden className={cn('mt-[0.2em] shrink-0', theme.accentText)} />
          <span className="min-w-0 [overflow-wrap:anywhere]">{block.note}</span>
        </p>
      )}
      {block.footer && (
        <p className={cn('mt-[0.5em] flex items-center gap-[0.45em] text-[1.25em] font-medium', theme.subtleText)}>
          <Repeat size="1em" aria-hidden className="shrink-0" />
          {block.footer}
        </p>
      )}
    </article>
  )
}
