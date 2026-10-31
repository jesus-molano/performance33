import { cn } from '@/lib/cn'
import type { DisplayExerciseLine } from '@/lib/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface DisplayExerciseRowCompactProps {
  line: DisplayExerciseLine
  week: number | null
  /** Warm-up/mobility rows: smaller so the main work stands out. */
  muted: boolean
  theme: DisplayThemeClasses
}

/**
 * Narrow-slot row: 'A1 Press banca ...... 4 × 8 · 60 kg' on one line (the prescription wraps
 * beneath, right-aligned, when it does not fit), then tempo/rest on one muted line and the client
 * cue on its own line (up to two lines, so it is not silently cut).
 */
export function DisplayExerciseRowCompact({ line, week, muted, theme }: DisplayExerciseRowCompactProps) {
  return (
    <li className="flex items-start gap-[0.45em] py-[0.2em]">
      {line.label && (
        <span
          className={cn(
            'tabular mt-[0.2em] min-w-[1.9em] shrink-0 rounded-[0.35em] px-[0.3em] text-center text-[1em] font-bold whitespace-nowrap',
            theme.badge,
          )}
        >
          {line.label}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-[0.5em]">
          <p className={cn('min-w-0 leading-tight font-semibold [overflow-wrap:anywhere]', muted ? 'text-[1.25em]' : 'text-[1.45em]')}>
            {line.name}
          </p>
          {(line.volume || line.load) && (
            <p className={cn('tabular ml-auto text-right leading-tight font-bold', muted ? 'text-[1.15em]' : 'text-[1.35em]')}>
              {line.volume}
              {line.volume && line.load && <span className={theme.subtleText}> · </span>}
              {line.load && <span className={theme.accentText}>{line.load}</span>}
              {line.progressed && <span className={cn('ml-[0.25em] align-top text-[0.6em]', theme.accentText)}>S{week}</span>}
            </p>
          )}
        </div>
        {line.detail && <p className={cn('tabular truncate text-[1.1em] leading-snug', theme.subtleText)}>{line.detail}</p>}
        {line.cue && <p className={cn('line-clamp-2 text-[1.15em] leading-snug', theme.secondaryText)}>{line.cue}</p>}
      </div>
    </li>
  )
}
