import { cn } from '@/lib/cn'
import type { DisplayExerciseLine } from '@/lib/display'
import { FIT_MAIN_PROPS, FIT_ROW_PROPS, type DisplayDensity } from '@/features/display/utils/autoFit'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'

interface DisplayExerciseRowProps {
  line: DisplayExerciseLine
  density: DisplayDensity
  /** Warm-up/mobility rows: same size, quieter colour, so the main work stands out. */
  muted: boolean
  theme: DisplayThemeClasses
}

/**
 * 'A1  Press banca ........ 4 × 8-10  60 kg': name and prescription at the same size, the prescription
 * right-aligned on the same edge in every row. Cue and tempo/rest go underneath and hide when the day
 * needs the room (see DETAIL_LEVELS). Nothing is clamped here: a long name takes its lines and the fit, which
 * measures them, makes the room.
 */
export function DisplayExerciseRow({ line, density, muted, theme }: DisplayExerciseRowProps) {
  const styles = DENSITY_STYLES[density]
  return (
    <li {...FIT_ROW_PROPS} className={cn('grid grid-cols-[auto_minmax(0,1fr)_fit-content(58%)] items-baseline', styles.row)}>
      <span className={cn(line.label && cn('tabular text-center font-bold whitespace-nowrap', styles.label, theme.badge))}>{line.label}</span>
      <p {...FIT_MAIN_PROPS} className={cn('font-bold text-balance [overflow-wrap:anywhere]', styles.main, muted && theme.secondaryText)}>
        {line.name}
      </p>
      <p {...FIT_MAIN_PROPS} className={cn('tabular flex flex-wrap justify-end gap-x-[0.45em] text-right font-bold [overflow-wrap:anywhere]', styles.main)}>
        {line.volume && <span className="min-w-0">{line.volume}</span>}
        {line.load && <span className={cn('min-w-0', theme.accentText)}>{line.load}</span>}
      </p>
      {line.detail && (
        <p className={cn('tabular col-span-2 col-start-2 truncate font-medium [display:var(--display-detail,block)]', styles.secondary, theme.subtleText)}>
          {line.detail}
        </p>
      )}
      {line.cue && (
        <div className="col-span-2 col-start-2 [display:var(--display-cue,block)]">
          <p className={cn('font-medium [overflow-wrap:anywhere]', styles.secondary, theme.secondaryText)}>{line.cue}</p>
        </div>
      )}
    </li>
  )
}
