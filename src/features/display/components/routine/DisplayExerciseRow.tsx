import { cn } from '../../../../lib/cn'
import type { DisplayExerciseLine } from '../../../../lib/display'
import type { DisplayThemeClasses } from '../../utils/theme'

interface DisplayExerciseRowProps {
  line: DisplayExerciseLine
  week: number
  /** Warm-up/mobility rows: smaller so the main work stands out. */
  compact: boolean
  theme: DisplayThemeClasses
}

/** 'A1  Press banca ........ 4 × 8-10 / 60 kg' with cue and tempo/rest underneath. */
export function DisplayExerciseRow({ line, week, compact, theme }: DisplayExerciseRowProps) {
  const mainSize = compact ? 'text-[1.6em]' : 'text-[2.05em]'
  return (
    <li className="flex items-start gap-[0.6em] py-[0.45em]">
      {line.label && (
        <span
          className={cn(
            'tabular mt-[0.25em] min-w-[2.1em] shrink-0 rounded-[0.4em] px-[0.35em] py-[0.05em] text-center text-[1.2em] font-bold whitespace-nowrap',
            theme.badge,
          )}
        >
          {line.label}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn('leading-tight font-semibold', mainSize)}>{line.name}</p>
        {line.cue && <p className={cn('text-[1.3em] leading-snug', theme.secondaryText)}>{line.cue}</p>}
        {line.detail && <p className={cn('tabular text-[1.15em] leading-snug', theme.subtleText)}>{line.detail}</p>}
      </div>
      {(line.volume || line.load) && (
        <div className="max-w-[48%] shrink-0 text-right">
          {line.volume && <p className={cn('tabular leading-tight font-bold', mainSize)}>{line.volume}</p>}
          {line.load && (
            <p className={cn('tabular text-[1.45em] leading-tight font-semibold', theme.accentText)}>
              {line.load}
              {line.progressed && <span className="ml-[0.3em] align-top text-[0.6em] opacity-80">S{week}</span>}
            </p>
          )}
        </div>
      )}
    </li>
  )
}
