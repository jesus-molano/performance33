import { useState, type FormEvent } from 'react'
import { auth, finishRecovery } from '@/auth'
import { errorText, newPasswordError } from '@/features/auth/utils/credentials'

export interface SetPasswordApi {
  password: string
  setPassword: (password: string) => void
  repeated: string
  setRepeated: (repeated: string) => void
  error: string | null
  busy: boolean
  submit: (event: FormEvent) => Promise<void>
}

/** New password after following the reset link, then into the app. */
export function useSetPassword(): SetPasswordApi {
  const [password, setPassword] = useState('')
  const [repeated, setRepeated] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const invalid = newPasswordError(password, repeated)
    setError(invalid)
    if (invalid) return
    setBusy(true)
    try {
      await auth.updatePassword(password)
      await finishRecovery()
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setBusy(false)
    }
  }

  return { password, setPassword, repeated, setRepeated, error, busy, submit }
}
