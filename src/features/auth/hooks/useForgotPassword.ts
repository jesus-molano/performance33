import { useState, type FormEvent } from 'react'
import { auth } from '@/auth'
import { AUTH_COPY } from '@/features/auth/config'
import { errorText, isValidEmail } from '@/features/auth/utils/credentials'

export interface ForgotPasswordApi {
  email: string
  setEmail: (email: string) => void
  error: string | null
  busy: boolean
  sent: boolean
  submit: (event: FormEvent) => Promise<void>
}

/** Asks for the password-reset email. */
export function useForgotPassword(): ForgotPasswordApi {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setError(AUTH_COPY.invalidEmail)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await auth.requestPasswordReset(email.trim())
      setSent(true)
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setBusy(false)
    }
  }

  return { email, setEmail, error, busy, sent, submit }
}
