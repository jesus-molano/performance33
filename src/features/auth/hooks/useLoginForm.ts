import { useState, type FormEvent } from 'react'
import { auth } from '@/auth'
import { AUTH_COPY } from '@/features/auth/config'
import { errorText, isValidEmail } from '@/features/auth/utils/credentials'

export interface LoginFormApi {
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  error: string | null
  busy: boolean
  submit: (event: FormEvent) => Promise<void>
  continueWithGoogle: () => Promise<void>
}

/** Email + password or Google. After success the session flow changes the screen by itself. */
export function useLoginForm(): LoginFormApi {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidEmail(email) || !password) {
      setError(AUTH_COPY.missingCredentials)
      return
    }
    await run(() => auth.signInWithPassword(email.trim(), password))
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    busy,
    submit,
    continueWithGoogle: () => run(() => auth.signInWithGoogle()),
  }
}
