import { useState, type FormEvent } from 'react'
import { refreshTeam, teamService } from '@/auth'
import { useToast } from '@/hooks'
import type { StaffMember } from '@/types'

export interface ProfileFormApi {
  name: string
  setName: (name: string) => void
  color: string
  setColor: (color: string) => void
  error: string | undefined
  busy: boolean
  submit: (event: FormEvent) => Promise<void>
}

/** 'Mi perfil': own name and colour only. */
export function useProfileForm(staff: StaffMember, onDone: () => void): ProfileFormApi {
  const { toast } = useToast()
  const [name, setName] = useState(staff.name)
  const [color, setColor] = useState(staff.color)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Escribe un nombre.')
      return
    }
    setError(undefined)
    setBusy(true)
    try {
      await teamService.updateOwnProfile(staff.id, { name: name.trim(), color })
      await refreshTeam()
      toast({ message: 'Perfil actualizado', tone: 'success' })
      onDone()
    } catch (failure) {
      toast({ message: failure instanceof Error ? failure.message : 'No se ha podido guardar.', tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return { name, setName, color, setColor, error, busy, submit }
}
