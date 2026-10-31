import type { DisplayRoutine } from '../../../lib/display'

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
}

/** Pure, props-driven branded routine view (black + pink). Never receives private data. */
export function RoutineDisplay({ routine, dayNumber }: RoutineDisplayProps) {
  const day = routine.days[dayNumber - 1]
  return (
    <section className="bg-ink p-6 text-white">
      <h1 className="text-3xl font-bold">{routine.clientFirstName}</h1>
      <p className="text-brand">{day?.title}</p>
    </section>
  )
}
