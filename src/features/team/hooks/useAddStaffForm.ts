import { useState, type FormEvent } from 'react'
import { refreshTeam, teamService } from '@/auth'
import { useToast } from '@/hooks'
import { useTeam } from '@/store'
import type { StaffRole } from '@/types'
import { suggestStaffColor, validateNewStaff, type StaffFormErrors } from '@/features/team/utils/staffForm'

export interface AddStaffFormApi {
  email: string
  setEmail: (email: string) => void
  name: string
  setName: (name: string) => void
  role: StaffRole
  setRole: (role: StaffRole) => void
  errors: StaffFormErrors
  busy: boolean
  submit: (event: FormEvent) => Promise<void>
}

/** Adds someone to the access list by email. */
export function useAddStaffForm(): AddStaffFormApi {
  const team = useTeam()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<StaffRole>('monitor')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const errors = validateNewStaff(email, name, team)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length > 0) return
    setBusy(true)
    try {
      await teamService.add({ email: email.trim().toLowerCase(), name: name.trim(), role }, suggestStaffColor(team))
      await refreshTeam()
      toast({ message: `${name.trim()} ya está en el equipo`, tone: 'success' })
      setEmail('')
      setName('')
      setRole('monitor')
      setTouched(false)
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : 'No se ha podido guardar.', tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return { email, setEmail, name, setName, role, setRole, errors: touched ? errors : {}, busy, submit }
}
