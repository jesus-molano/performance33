import { useState, type FormEvent } from 'react'
import { refreshTeamQuietly, teamService } from '@/auth'
import { useToast } from '@/hooks'
import { normalizeEmail, normalizeUsername, suggestUsername } from '@/lib/accountRules'
import type { Profile, ProfileRole } from '@/types'
import { TEAM_COPY } from '@/features/team/config'
import { suggestColor, validateNewAccount, type AccountFormErrors, type AccountFormValues } from '@/features/team/utils/accountForm'
import type { TemporaryPassword } from './useTeamPanel'

export interface CreateAccountFormApi extends AccountFormValues {
  setName: (name: string) => void
  /** Until someone types here, it follows the name. */
  setUsername: (username: string) => void
  setEmail: (email: string) => void
  role: ProfileRole
  setRole: (role: ProfileRole) => void
  errors: AccountFormErrors
  busy: boolean
  submit: (event: FormEvent) => Promise<void>
}

/** 'Crear cuenta': on success hands the temporary password over to be shown once. */
export function useCreateAccountForm(accounts: readonly Profile[], onCreated: (temporary: TemporaryPassword) => void): CreateAccountFormApi {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [typedUsername, setTypedUsername] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProfileRole>('monitor')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const username = typedUsername ?? suggestUsername(name)
  const errors = validateNewAccount({ name, username, email }, accounts)

  const reset = () => {
    setName('')
    setTypedUsername(null)
    setEmail('')
    setRole('monitor')
    setTouched(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length > 0) return
    setBusy(true)
    try {
      const clean = { name: name.trim(), username: normalizeUsername(username) }
      const password = await teamService.createAccount({ ...clean, email: normalizeEmail(email) || null, role, color: suggestColor(accounts) })
      await refreshTeamQuietly()
      onCreated({ ...clean, password })
      reset()
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : TEAM_COPY.saveFailed, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return { name, setName, username, setUsername: setTypedUsername, email, setEmail, role, setRole, errors: touched ? errors : {}, busy, submit }
}
