import { useState, type FormEvent } from 'react'
import { errorText, newPasswordError, passwordStrength, type PasswordStrength } from '@/features/auth/utils/credentials'

export interface NewPasswordFormApi {
  password: string
  setPassword: (password: string) => void
  repeated: string
  setRepeated: (repeated: string) => void
  strength: PasswordStrength
  error: string | null
  busy: boolean
  submit: (event: FormEvent) => Promise<void>
}

/** New password + confirmation, used by the first login and by 'Mi perfil'. `save` rejects with a Spanish message. */
export function useNewPasswordForm(save: (password: string) => Promise<void>): NewPasswordFormApi {
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
      await save(password)
      setPassword('')
      setRepeated('')
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setBusy(false)
    }
  }

  return { password, setPassword, repeated, setRepeated, strength: passwordStrength(password), error, busy, submit }
}
