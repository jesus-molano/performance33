import { BellRing, Lock } from 'lucide-react'
import { PrivateSurface } from '@/components/ui'
import { paths } from '@/lib/routes'
import { usePinnedNotes } from '@/store'

/**
 * One amber line per important notification, for the routine editor: the coach sees them
 * while picking exercises. Coach-only, never part of the TV data.
 */
export function CompactImportantNotes({ clientId }: { clientId: string }) {
  const notes = usePinnedNotes(clientId)
  if (notes.length === 0) return null
  return (
    <PrivateSurface role="note" aria-label="Notificaciones importantes del usuario" className="flex items-start gap-3 border-2 px-3 py-2.5 sm:px-4">
      <BellRing size={20} aria-hidden className="mt-0.5 shrink-0 text-private-icon" />
      <ul className="min-w-0 flex-1 text-md font-medium text-amber-950">
        {notes.map((note) => (
          <li key={note.id} className="line-clamp-2">
            {note.text}
          </li>
        ))}
      </ul>
      <span className="hidden shrink-0 items-center gap-1 text-[0.8125rem] font-semibold tracking-wide uppercase lg:inline-flex">
        <Lock size={14} aria-hidden />
        Solo monitores
      </span>
      <a href={paths.client(clientId)} className="-my-2 inline-flex min-h-11 shrink-0 items-center rounded-lg px-1 text-sm font-semibold underline underline-offset-2 hover:text-amber-950">
        Ver ficha
      </a>
    </PrivateSurface>
  )
}
