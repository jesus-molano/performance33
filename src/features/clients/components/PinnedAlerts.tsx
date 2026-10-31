import { TriangleAlert } from 'lucide-react'
import { PrivacyLabel, PrivateSurface } from '../../../components/ui'
import { formatDateTime } from '../../../lib/dates'
import { useCoach, usePinnedNotes } from '../../../store'
import type { ClientNote } from '../../../types'

function AlertLine({ note }: { note: ClientNote }) {
  const author = useCoach(note.authorId)
  return (
    <li className="flex flex-col gap-0.5">
      <p className="text-[15px] font-medium whitespace-pre-wrap text-amber-950">{note.text}</p>
      <p className="text-xs text-private">
        {author?.name ?? 'Monitor eliminado'} · {formatDateTime(note.createdAt)}
      </p>
    </li>
  )
}

/** Amber banner with the client's pinned private notes (health alerts). Never shown on the TV. */
export function PinnedAlerts({ clientId }: { clientId: string }) {
  const alerts = usePinnedNotes(clientId)
  if (alerts.length === 0) return null
  return (
    <PrivateSurface role="note" aria-label="Alertas internas" className="mb-6 flex gap-3 border-2 p-4 sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-private-line/50 text-private">
        <TriangleAlert size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold text-private">{alerts.length === 1 ? 'Alerta' : 'Alertas'}</h2>
          <PrivacyLabel kind="private" className="text-private" />
        </div>
        <ul className="flex flex-col gap-3">
          {alerts.map((note) => (
            <AlertLine key={note.id} note={note} />
          ))}
        </ul>
      </div>
    </PrivateSurface>
  )
}
