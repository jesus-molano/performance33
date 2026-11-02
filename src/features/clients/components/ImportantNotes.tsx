import { BellRing } from 'lucide-react'
import { PrivacyLabel, PrivateSurface } from '@/components/ui'
import { formatDateTime } from '@/lib/dates'
import { usePinnedNotes, useTeamMember } from '@/store'
import type { ClientNote } from '@/types'

function ImportantLine({ note }: { note: ClientNote }) {
  const author = useTeamMember(note.authorId)
  return (
    <li className="flex flex-col gap-0.5">
      <p className="text-md font-medium whitespace-pre-wrap text-amber-950">{note.text}</p>
      <p className="text-xs text-private">
        {author?.name ?? 'Monitor eliminado'} · {formatDateTime(note.createdAt)}
      </p>
    </li>
  )
}

/** Amber banner with the client's important notifications (pinned private notes). Never shown on the TV. */
export function ImportantNotes({ clientId }: { clientId: string }) {
  const notes = usePinnedNotes(clientId)
  if (notes.length === 0) return null
  return (
    <PrivateSurface role="note" aria-label="Notificaciones importantes" className="mb-6 flex gap-3 border-2 p-4 sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-private-line/50 text-private">
        <BellRing size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold text-private">{notes.length === 1 ? 'Notificación importante' : 'Notificaciones importantes'}</h2>
          <PrivacyLabel kind="private" className="text-private" />
        </div>
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <ImportantLine key={note.id} note={note} />
          ))}
        </ul>
      </div>
    </PrivateSurface>
  )
}
