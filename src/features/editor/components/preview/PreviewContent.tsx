import { Info, Lock, TriangleAlert } from 'lucide-react'
import { Callout } from '@/components/ui'
import { cn } from '@/lib/cn'
import { RoutinePreview } from '@/features/display'
import { usePreviewFit } from '@/features/editor/hooks/usePreviewFit'

export interface PreviewContentProps {
  programId: string
  dayId: string | null
  /** Extra classes for the TV frame (e.g. a height-based width in the side panel). */
  frameClassName?: string
}

/** Live mini TV of the selected day + reminder that private notes never show up there. */
export function PreviewContent({ programId, dayId, frameClassName }: PreviewContentProps) {
  const fit = usePreviewFit()
  return (
    <div className="flex flex-col gap-3">
      <RoutinePreview programId={programId} dayId={dayId} onFitChange={fit.onFitChange} className={frameClassName ? cn('mx-auto', frameClassName) : undefined} />
      {fit.warning && (
        <Callout tone="warning" icon={TriangleAlert}>
          {fit.warning}
        </Callout>
      )}
      {fit.notice && <Callout icon={Info}>{fit.notice}</Callout>}
      <p className="flex items-start gap-1.5 text-sm text-fg-muted">
        <Lock size={15} aria-hidden className="mt-0.5 shrink-0 text-private-icon" />
        Las notas internas nunca aparecen en la pantalla.
      </p>
    </div>
  )
}
