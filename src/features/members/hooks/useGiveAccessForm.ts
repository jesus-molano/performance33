import { useState, type FormEvent } from 'react'
import { formatFullName } from '@/lib/format'
import type { Client } from '@/types'
import { GIVE_ACCESS_COPY } from '@/features/members/config/copy'
import type { GiveAccessInput } from '@/features/members/types'
import { giveAccessErrors, giveAccessInput, suggestedUsername } from '@/features/members/utils/giveAccess'

export interface GiveAccessFormApi {
  username: string
  email: string
  setUsername: (value: string) => void
  setEmail: (value: string) => void
  errors: { username?: string; email?: string }
  /** What the server refused (username or email in use, no connection). */
  failure: string | null
  submit: (event: FormEvent) => Promise<void>
}

/** The username starts as the one the server would pick; left as it is, the server numbers it if someone has it. */
export function useGiveAccessForm(client: Client, onSubmit: (input: GiveAccessInput) => Promise<void>): GiveAccessFormApi {
  const [username, setUsernameValue] = useState(() => suggestedUsername(formatFullName(client.firstName, client.lastName)))
  const [usernameEdited, setUsernameEdited] = useState(false)
  const [email, setEmail] = useState('')
  const [checked, setChecked] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const draft = { username, email, usernameEdited }
  const found = checked ? giveAccessErrors(draft) : {}

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setChecked(true)
    setFailure(null)
    if (Object.keys(giveAccessErrors(draft)).length) return
    try {
      await onSubmit(giveAccessInput(draft))
    } catch (error) {
      setFailure(error instanceof Error ? error.message : null)
    }
  }

  return {
    username,
    email,
    setUsername: (value) => {
      setUsernameValue(value)
      setUsernameEdited(true)
    },
    setEmail,
    errors: {
      username: found.username && GIVE_ACCESS_COPY.usernameInvalid,
      email: found.email && GIVE_ACCESS_COPY.emailInvalid,
    },
    failure,
    submit,
  }
}
