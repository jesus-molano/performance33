import { Lock, MonitorPlay } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { RoutinePreview } from '../../../display'

export interface PreviewContentProps {
  programId: string
  dayId: string | null
  onOpenScreen: () => void
}

/** Live mini TV of the selected day + reminder that private notes never show up there. */
export function PreviewContent({ programId, dayId, onOpenScreen }: PreviewContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <RoutinePreview programId={programId} dayId={dayId} />
      <p className="flex items-start gap-1.5 text-sm text-fg-muted">
        <Lock size={15} aria-hidden className="mt-0.5 shrink-0 text-private-icon" />
        Las notas internas nunca aparecen en la pantalla.
      </p>
      <Button variant="dark" leftIcon={MonitorPlay} onClick={onOpenScreen} fullWidth>
        Abrir en pantalla
      </Button>
    </div>
  )
}
