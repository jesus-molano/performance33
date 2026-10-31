import { useState, type FormEvent } from 'react'
import { useConfirm } from '../../../hooks/useConfirm'
import { useToast } from '../../../hooks/useToast'
import { useAppActions, useCoaches, useCurrentCoachId, useUiStore } from '../../../store'
import type { Coach } from '../../../types'
import { suggestCoachColor, validateCoachName } from '../utils/coachForm'

export interface CoachFormApi {
  isEdit: boolean
  name: string
  setName: (name: string) => void
  color: string
  setColor: (color: string) => void
  error: string | undefined
  canDelete: boolean
  submit: (event: FormEvent) => void
  remove: () => Promise<void>
}

/** Create/edit a coach profile. `onDone` closes the form. */
export function useCoachForm(coach: Coach | null, onDone: () => void): CoachFormApi {
  const coaches = useCoaches()
  const currentId = useCurrentCoachId()
  const setCurrentCoach = useUiStore((s) => s.setCurrentCoach)
  const { addCoach, updateCoach, deleteCoach } = useAppActions()
  const confirm = useConfirm()
  const { toast } = useToast()
  const [name, setName] = useState(coach?.name ?? '')
  const [color, setColor] = useState(coach?.color ?? suggestCoachColor(coaches))
  const [touched, setTouched] = useState(false)
  const validation = validateCoachName(name, coaches, coach?.id ?? null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (validation) return
    const input = { name: name.trim(), color }
    if (coach) updateCoach(coach.id, input)
    else addCoach(input)
    toast({ message: coach ? 'Perfil actualizado' : `${input.name} ya puede entrar`, tone: 'success' })
    onDone()
  }

  const remove = async () => {
    if (!coach) return
    const ok = await confirm({
      title: `¿Eliminar a ${coach.name}?`,
      description: 'Sus notas se conservarán, firmadas como «Monitor eliminado».',
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    if (!deleteCoach(coach.id)) {
      toast({ message: 'Necesitas al menos un monitor.', tone: 'error' })
      return
    }
    if (coach.id === currentId) setCurrentCoach(null)
    onDone()
  }

  return {
    isEdit: coach !== null,
    name,
    setName,
    color,
    setColor,
    error: touched ? validation : undefined,
    canDelete: coach !== null && coaches.length > 1,
    submit,
    remove,
  }
}
