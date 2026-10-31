import { Pencil, UserPlus } from 'lucide-react'
import { Avatar, Badge, Button, Card } from '@/components/ui'
import { useCoaches, useCurrentCoachId } from '@/store'
import type { Coach } from '@/types'
import { editedItem, useEditTarget } from '@/features/shell'
import { CoachFormModal } from './CoachFormModal'

function CoachRow({ coach, isCurrent, onEdit }: { coach: Coach; isCurrent: boolean; onEdit: (coach: Coach) => void }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Avatar firstName={coach.name} color={coach.color} />
      <span className="min-w-0 flex-1 truncate text-md font-medium text-fg">{coach.name}</span>
      {isCurrent && <Badge tone="brand">Eres tú</Badge>}
      <Button variant="ghost" leftIcon={Pencil} onClick={() => onEdit(coach)}>
        Editar
      </Button>
    </li>
  )
}

/** Coaches list for Ajustes → Monitores (add, rename, recolour, delete). */
export function CoachManager() {
  const coaches = useCoaches()
  const currentId = useCurrentCoachId()
  const form = useEditTarget<Coach>()

  return (
    <Card padding="none">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-fg">Monitores</h2>
          <p className="text-sm text-fg-muted">Aparecen en «¿Quién eres?» y firman las notas internas.</p>
        </div>
        <Button leftIcon={UserPlus} onClick={form.openCreate}>
          Añadir monitor
        </Button>
      </div>
      <ul className="divide-y divide-line">
        {coaches.map((coach) => (
          <CoachRow key={coach.id} coach={coach} isCurrent={coach.id === currentId} onEdit={form.openEdit} />
        ))}
      </ul>
      {form.target && <CoachFormModal coach={editedItem(form.target)} onClose={form.close} />}
    </Card>
  )
}
