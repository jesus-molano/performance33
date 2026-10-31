import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import type { DisplayRoutine } from '@/lib/display'
import { useAutoFit } from '@/features/display/hooks/useAutoFit'
import type { FitStatus } from '@/features/display/utils/autoFit'
import { getDisplayTheme } from '@/features/display/utils/theme'
import { DisplayBlockList } from './routine/DisplayBlockList'
import { DisplayEmptyDay } from './routine/DisplayEmptyDay'
import { DisplayHeader } from './routine/DisplayHeader'

export type RoutineDisplayLayout = 'column' | 'full' | 'preview'

export interface RoutineDisplayProps {
  routine: DisplayRoutine
  /** 1-based day number (clamp with clampDayNumber). */
  dayNumber: number
  /** column = a third of a 16:9 TV; full = whole screen (2 columns if needed); preview = editor side panel. */
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
  const { containerRef, contentRef, style, overflowing, tooSmall } = useAutoFit({
    maxColumns: layout === 'full' ? 2 : 1,
    fontScale,
    fitKey: day,
  })
  useEffect(() => onFitChange?.({ overflowing, tooSmall }), [onFitChange, overflowing, tooSmall])

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden font-sans', theme.root)}>
      <div ref={contentRef} style={style} className="flex flex-col gap-[1.1em] px-[1.3em] pt-[1.2em] pb-[0.4em]">
        <DisplayHeader routine={routine} day={day} theme={theme} />
        {day && day.blocks.length > 0 ? (
          <DisplayBlockList blocks={day.blocks} week={routine.week} theme={theme} flashBlockIds={flashBlockIds} />
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
