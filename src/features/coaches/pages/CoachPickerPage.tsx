import { Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import { useBranding, useCoaches } from '@/store'
import type { Coach } from '@/types'
import { BrandLogo, editedItem, useEditTarget } from '@/features/shell'
import { CoachFormModal } from '@/features/coaches/components/CoachFormModal'
import { AddCoachTile, CoachTile } from '@/features/coaches/components/CoachTile'
import { useCoachPicker } from '@/features/coaches/hooks/useCoachPicker'

/** '¿Quién eres?' full-screen picker. After choosing: setCurrentCoach(id) and, on '#/', navigate(paths.clients()). */
export function CoachPickerPage() {
  const coaches = useCoaches()
  const { tagline } = useBranding()
  const selectCoach = useCoachPicker()
  const editing = useDisclosure()
  const form = useEditTarget<Coach>()
  const onTileClick = (coach: Coach) => (editing.isOpen ? form.openEdit(coach) : selectCoach(coach.id))

  return (
    <div className="flex min-h-dvh flex-col items-center bg-ink px-4 py-10 text-white">
      <BrandLogo className="h-14 sm:h-16" />
      <main className="flex w-full max-w-4xl flex-1 animate-fade-in flex-col items-center justify-center gap-10 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">¿Quién eres?</h1>
          <p className="mt-3 text-lg text-ink-muted">
            {editing.isOpen ? 'Toca un perfil para cambiar su nombre o color.' : 'Elige tu perfil para empezar.'}
          </p>
        </div>
        <ul className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {coaches.map((coach) => (
            <li key={coach.id}>
              <CoachTile coach={coach} editing={editing.isOpen} onClick={onTileClick} />
            </li>
          ))}
          <li>
            <AddCoachTile onClick={form.openCreate} />
          </li>
        </ul>
        <Button
          variant="ghost"
          size="lg"
          leftIcon={editing.isOpen ? Check : Pencil}
          onClick={editing.toggle}
          className="border border-ink-line text-ink-muted hover:bg-white/10 hover:text-white"
        >
          {editing.isOpen ? 'Listo' : 'Editar perfiles'}
        </Button>
      </main>
      {tagline && <p className="text-center text-sm text-ink-muted">{tagline}</p>}
      {form.target && <CoachFormModal coach={editedItem(form.target)} onClose={form.close} />}
    </div>
  )
}
