import { Lock } from 'lucide-react'
import { Card, PrivacyLabel } from '../../../components/ui'
import { useClientNotes } from '../../../store'
import { NoteComposer } from './NoteComposer'
import { NoteItem } from './NoteItem'

/** Private notes timeline (all coaches see it; never sent to the TV). */
export function NotesPanel({ clientId }: { clientId: string }) {
  const notes = useClientNotes(clientId)
  return (
    <Card padding="none" className="overflow-hidden border-private-line">
      <div className="flex items-start gap-3 border-b border-private-line bg-private-bg px-4 py-3 sm:px-5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-private-line/50 text-private">
          <Lock size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-private">Notas internas</h2>
          <PrivacyLabel kind="private" />
          <p className="mt-1 text-sm text-private/80">Nunca salen en la pantalla del gimnasio.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <NoteComposer clientId={clientId} />
        {notes.length > 0 ? (
          <ol className="flex flex-col gap-2.5" aria-label="Historial de notas">
            {notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </ol>
        ) : (
          <p className="text-center text-sm text-fg-muted">Todavía no hay notas sobre este cliente.</p>
        )}
      </div>
    </Card>
  )
}
