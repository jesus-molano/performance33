import { MonitorOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PREVIEW_ASPECT_CLASS } from '@/features/display/config/display'
import type { FitStatus } from '@/features/display/utils/autoFit'
import { usePreviewRoutine } from '@/features/display/hooks/usePreviewRoutine'
import { RoutineDisplay } from './RoutineDisplay'

export interface RoutinePreviewProps {
  programId: string
  /** Day to show (the editor's selected day); null when the program has no days yet. */
  dayId: string | null
  /** Width classes (default w-full). */
  className?: string
  onFitChange?: (status: FitStatus) => void
}

/**
 * Live mini TV preview for the editor ('Vista pantalla'): what the client sees in a narrow (3-4 column)
 * TV slot, compact layout included, built from sanitised data (private notes are never part of it).
 */
export function RoutinePreview({ programId, dayId, className, onFitChange }: RoutinePreviewProps) {
  const preview = usePreviewRoutine(programId, dayId)
  return (
    <div
      className={cn(
        PREVIEW_ASPECT_CLASS,
        className ?? 'w-full',
        'overflow-hidden rounded-2xl bg-ink shadow-pop ring-1 ring-black/10',
      )}
    >
      {preview ? (
        <RoutineDisplay routine={preview.routine} dayNumber={preview.dayNumber} layout="preview" onFitChange={onFitChange} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-ink-muted">
          <MonitorOff size={28} aria-hidden />
          <p className="text-sm">Añade un día para ver la pantalla.</p>
        </div>
      )}
    </div>
  )
}
