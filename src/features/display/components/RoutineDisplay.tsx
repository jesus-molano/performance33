import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import type { DisplayRoutine } from '@/lib/display'
import { useAutoFit } from '@/features/display/hooks/useAutoFit'
import type { FitStatus } from '@/features/display/utils/autoFit'
import { getDisplayTheme } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './routine/densityStyles'
import { DisplayBlockList } from './routine/DisplayBlockList'
import { DisplayEmptyDay } from './routine/DisplayEmptyDay'
import { DisplayHeader } from './routine/DisplayHeader'
import { DisplayHeaderCompact } from './routine/DisplayHeaderCompact'

export type RoutineDisplayLayout = 'column' | 'full' | 'preview'

export interface RoutineDisplayProps {
  routine: DisplayRoutine
  /** 1-based day number (clamp with clampDayNumber). */
  dayNumber: number
  /**
   * column = one TV slot; full = whole screen (prefers 2 columns when text gets clearly bigger);
   * preview = editor side panel. Narrow slots switch to the compact density automatically.
   */
  layout?: RoutineDisplayLayout
  /** Manual A-/A+ multiplier on top of auto-fit (default 1). */
  fontScale?: number
  /** Blocks to flash with the 'actualizado' highlight. */
  flashBlockIds?: ReadonlySet<string>
  /** Reports when the day does not fit or gets too small to read (editor warning). */
  onFitChange?: (status: FitStatus) => void
}

const NO_FLASH: ReadonlySet<string> = new Set()

/**
 * Pure, props-driven branded routine view. It fills its parent and auto-fits the whole day
 * without scrolling. It only ever receives sanitised data (no private notes).
 */
export function RoutineDisplay({
  routine,
  dayNumber,
  layout = 'column',
  fontScale = 1,
  flashBlockIds = NO_FLASH,
  onFitChange,
}: RoutineDisplayProps) {
  const day = routine.days[dayNumber - 1] ?? null
  const theme = getDisplayTheme(routine.branding.displayTheme)
  const { containerRef, contentRef, style, density, overflowing, tooSmall, detailHidden } = useAutoFit({
    preferColumns: layout === 'full',
    fontScale,
    fitKey: day,
  })
  useEffect(() => onFitChange?.({ overflowing, tooSmall, detailHidden }), [onFitChange, overflowing, tooSmall, detailHidden])
  const Header = density === 'compact' ? DisplayHeaderCompact : DisplayHeader

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden font-sans', theme.root)}>
      <div ref={contentRef} style={style} className={cn('flex flex-col', DENSITY_STYLES[density].content)}>
        <Header routine={routine} day={day} theme={theme} />
        {day && day.blocks.length > 0 ? (
          <DisplayBlockList
            blocks={day.blocks}
            density={density}
            theme={theme}
            flashBlockIds={flashBlockIds}
          />
        ) : (
          <DisplayEmptyDay hasDays={routine.days.length > 0} theme={theme} />
        )}
      </div>
      {overflowing && layout !== 'preview' && (
        <span aria-hidden className={cn('absolute right-[0.6em] bottom-[0.2em] text-[2em] leading-none font-bold', theme.accentText)}>
          …
        </span>
      )}
    </div>
  )
}
