import { CircleCheck, MonitorX, ScanSearch, type LucideIcon } from 'lucide-react'
import { Button, Callout } from '@/components/ui'
import { detectionNote } from '@/config/screenDetection'
import type { ScreenDetectionState } from '@/lib/screenDetails'

export interface ScreenDetectionNoticeProps {
  state: ScreenDetectionState
  tvCount: number
  /** Asks the browser for the permission (shown only while it is needed). */
  onRequest: () => void
  className?: string
}

const ICONS: Record<ScreenDetectionState, LucideIcon> = {
  unsupported: MonitorX,
  'needs-permission': ScanSearch,
  denied: MonitorX,
  single: MonitorX,
  ok: CircleCheck,
}

/** What this computer can see of the TVs, in plain words, with the one step that fixes it. */
export function ScreenDetectionNotice({ state, tvCount, onRequest, className }: ScreenDetectionNoticeProps) {
  const note = detectionNote(state, tvCount)
  const fine = state === 'ok' && tvCount > 0
  return (
    <Callout tone={fine || state === 'unsupported' ? 'info' : 'warning'} icon={ICONS[state]} className={className}>
      <p className="font-semibold">{note.title}</p>
      {note.body && <p className="mt-0.5">{note.body}</p>}
      {note.action && (
        <Button size="sm" leftIcon={ScanSearch} onClick={onRequest} className="mt-2">
          {note.action}
        </Button>
      )}
    </Callout>
  )
}
