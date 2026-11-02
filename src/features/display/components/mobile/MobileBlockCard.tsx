import { MessageSquareText } from 'lucide-react'
import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import { joinParts } from '@/lib/format'
import { getBlockOverline, getVisibleBadge } from '@/features/display/utils/blockBadges'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { MobileExerciseRow } from './MobileExerciseRow'

interface MobileBlockCardProps {
  block: DisplayBlock
  theme: DisplayThemeClasses
  flashing: boolean
}

/** One block on the phone page, at normal text sizes and with nothing hidden. */
export function MobileBlockCard({ block, theme, flashing }: MobileBlockCardProps) {
  const Icon = BLOCK_TYPE_META[block.type].icon
  const overline = getBlockOverline(block)
  const badge = getVisibleBadge(block)
  const summary = joinParts([block.subtitle, block.footer])
  const headlineColor = block.muted ? theme.secondaryText : theme.accentText

  return (
    <article className={cn('rounded-2xl p-4', block.muted ? theme.mutedCard : theme.card, flashing && 'animate-flash')}>
      <header className="flex items-start gap-2.5">
        <Icon size={22} aria-hidden className={cn('mt-0.5 shrink-0', headlineColor)} />
        <div className="min-w-0 flex-1">
          {overline && <p className={cn('text-sm font-semibold tracking-wide uppercase', theme.subtleText)}>{overline}</p>}
          <h2 className={cn('text-lg leading-snug font-bold tracking-wide uppercase [overflow-wrap:anywhere]', headlineColor)}>{block.headline}</h2>
          {summary && <p className={cn('text-base leading-snug', theme.secondaryText)}>{summary}</p>}
        </div>
        {badge && <span className={cn('shrink-0 rounded-full px-2 text-sm font-bold', theme.outlineBadge)}>{badge}</span>}
        {block.chip && <span className={cn('tabular shrink-0 rounded-md px-2 py-0.5 text-base font-bold', theme.badge)}>{block.chip}</span>}
      </header>
      {block.text && <p className={cn('mt-2 text-base leading-snug whitespace-pre-line [overflow-wrap:anywhere]', theme.secondaryText)}>{block.text}</p>}
      {block.exercises.length > 0 && (
        <ul className={cn('mt-1 divide-y', theme.rowDivider)}>
          {block.exercises.map((line) => (
            <MobileExerciseRow key={line.id} line={line} muted={block.muted} theme={theme} />
          ))}
        </ul>
      )}
      {block.note && (
        <p className={cn('mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-base leading-snug', theme.noteSurface, theme.secondaryText)}>
          <MessageSquareText size={18} aria-hidden className={cn('mt-0.5 shrink-0', theme.accentText)} />
          <span className="min-w-0 [overflow-wrap:anywhere]">{block.note}</span>
        </p>
      )}
    </article>
  )
}
