import { cn } from '@/lib/cn'
import type { DisplayExerciseLine } from '@/lib/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface MobileExerciseRowProps {
  line: DisplayExerciseLine
  muted: boolean
  theme: DisplayThemeClasses
}

/** Phone row: name on top, prescription under it, then everything the TV may hide (tempo, rest, cue). */
export function MobileExerciseRow({ line, muted, theme }: MobileExerciseRowProps) {
  return (
    <li className="flex gap-3 py-3">
      {line.label && <span className={cn('tabular h-fit shrink-0 rounded-md px-2 py-0.5 text-sm font-bold', theme.badge)}>{line.label}</span>}
      <div className="min-w-0 flex-1">
        <p className={cn('text-lg leading-snug font-semibold [overflow-wrap:anywhere]', muted && theme.secondaryText)}>{line.name}</p>
        <p className="tabular flex flex-wrap gap-x-2 text-lg leading-snug font-bold [overflow-wrap:anywhere]">
          {line.volume && <span>{line.volume}</span>}
          {line.load && <span className={theme.accentText}>{line.load}</span>}
        </p>
        {line.detail && <p className={cn('tabular mt-0.5 text-base', theme.subtleText)}>{line.detail}</p>}
        {line.cue && <p className={cn('mt-0.5 text-base [overflow-wrap:anywhere]', theme.secondaryText)}>{line.cue}</p>}
      </div>
    </li>
  )
}
