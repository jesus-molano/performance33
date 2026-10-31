import { MonitorOff } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { PREVIEW_ASPECT_CLASS } from '../config/display'
import { usePreviewRoutine } from '../hooks/usePreviewRoutine'
import { RoutineDisplay } from './RoutineDisplay'

export interface RoutinePreviewProps {
  programId: string
  /** Day to show (the editor's selected day); null when the program has no days yet. */
  dayId: string | null
  className?: string
}

/**
 * Live mini TV preview for the editor ('Vista pantalla'): exactly what the client sees on a third
 * of the TV, built from sanitised data (private notes are never part of it).
 */
export function RoutinePreview({ programId, dayId, className }: RoutinePreviewProps) {
  const preview = usePreviewRoutine(programId, dayId)
  return (
    <div
      className={cn(
        PREVIEW_ASPECT_CLASS,
        'w-full overflow-hidden rounded-2xl bg-ink shadow-pop ring-1 ring-black/10',
        className,
      )}
    >
      {preview ? (
        <RoutineDisplay routine={preview.routine} dayNumber={preview.dayNumber} layout="preview" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-ink-muted">
          <MonitorOff size={28} aria-hidden />
          <p className="text-sm">Añade un día para ver la pantalla.</p>
        </div>
      )}
    </div>
  )
}
