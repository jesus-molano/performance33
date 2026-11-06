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
import { DisplayOverflowBand } from './routine/DisplayOverflowBand'

export type RoutineDisplayLayout = 'column' | 'full' | 'preview'

export interface RoutineDisplayProps {
  routine: DisplayRoutine
  /** 1-based day number (clamp with clampDayNumber). */
  dayNumber: number
  /**
   * column = one TV section; full = only client on the screen. Both read as one column top to bottom unless the slot is
   * landscape (full screen, or a section of a 2-row grid) and one column does not fit at a good size: then two parts.
   * preview = editor side panel, never split.
   * Narrow slots switch to the compact density automatically.
   */
  layout?: RoutineDisplayLayout
  /** Manual A-/A+ multiplier on top of auto-fit (default 1). */
  fontScale?: number
  /** Blocks to flash with the 'actualizado' highlight. */
  flashBlockIds?: ReadonlySet<string>
  /** Reports when the day does not fit or gets too small to read (editor warning). */
  onFitChange?: (status: FitStatus) => void
  /** Largest text unit, shared by the columns of a TV. */
  unitCap?: number
  /** The unit this day could show by itself; null when it leaves the screen. */
  onUnitChange?: (unit: number | null) => void
  /** Height of the whole TV when this is one section of it (sizes are read against the TV, not the section). */
  referenceHeight?: number
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
  unitCap,
  onUnitChange,
  referenceHeight,
}: RoutineDisplayProps) {
  const day = routine.days[dayNumber - 1] ?? null
  const theme = getDisplayTheme(routine.branding.displayTheme)
  const { containerRef, contentRef, style, density, overflowing, tooSmall, detailHidden, fittedUnit, hiddenRows } = useAutoFit({
    canSplit: layout !== 'preview' && (day?.blocks.length ?? 0) > 1,
    fontScale,
    fitKey: day,
    unitCap,
    referenceHeight,
  })
  useEffect(() => {
    onUnitChange?.(fittedUnit)
    return () => onUnitChange?.(null)
  }, [onUnitChange, fittedUnit])
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
      {overflowing && layout !== 'preview' && <DisplayOverflowBand hiddenRows={hiddenRows} theme={theme} />}
    </div>
  )
}
