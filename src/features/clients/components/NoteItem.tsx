import { Pencil, Pin, PinOff, Trash2, TriangleAlert } from 'lucide-react'
import { Avatar, Badge, Button, DropdownMenu, Textarea, type MenuItem } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ClientNote } from '@/types'
import { useNoteItem } from '@/features/clients/hooks/useNoteItem'

/** One private note: author, date, text; pin/edit/delete in the '⋯' menu. Edits autosave. */
export function NoteItem({ note }: { note: ClientNote }) {
  const item = useNoteItem(note)
  const menu: MenuItem[] = [
    note.pinned
      ? { label: 'Quitar alerta', icon: PinOff, onSelect: item.togglePin }
      : { label: 'Fijar como alerta', icon: Pin, onSelect: item.togglePin },
    { label: 'Editar', icon: Pencil, onSelect: item.startEditing },
    'separator',
    { label: 'Eliminar nota', icon: Trash2, danger: true, onSelect: item.remove },
  ]

  return (
    <li
      className={cn(
        'rounded-xl border p-3',
        note.pinned ? 'border-private-line bg-private-bg' : 'border-line bg-surface',
      )}
    >
      <div className="flex items-center gap-2.5">
        <Avatar firstName={item.authorName} color={item.authorColor} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-fg">{item.authorName}</p>
          <p className="text-xs text-fg-subtle">{item.dateLabel}</p>
        </div>
        {note.pinned && (
          <Badge tone="private" icon={TriangleAlert} size="sm">
            Alerta
          </Badge>
        )}
        <DropdownMenu items={menu} label={`Opciones de la nota de ${item.authorName}`} />
      </div>
      {item.isEditing ? (
        <div className="mt-2 flex flex-col gap-2">
          <Textarea aria-label="Texto de la nota" value={note.text} onChange={(e) => item.changeText(e.target.value)} autoFocus rows={3} />
          <Button size="sm" variant="secondary" onClick={item.finishEditing} className="h-10 self-end">
            Listo
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-md leading-relaxed whitespace-pre-wrap text-fg">{note.text}</p>
      )}
    </li>
  )
}
