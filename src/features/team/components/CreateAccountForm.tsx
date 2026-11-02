import { UserPlus } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { ACCOUNT_NAME_MAX_LENGTH, USERNAME_MAX_LENGTH } from '@/lib/accountRules'
import type { Profile } from '@/types'
import { ROLE_OPTIONS, TEAM_COPY } from '@/features/team/config'
import { useCreateAccountForm } from '@/features/team/hooks/useCreateAccountForm'
import type { TemporaryPassword } from '@/features/team/hooks/useTeamPanel'

export interface CreateAccountFormProps {
  accounts: readonly Profile[]
  onCreated: (temporary: TemporaryPassword) => void
}

/** Creates someone's account. Nobody can register on their own. */
export function CreateAccountForm({ accounts, onCreated }: CreateAccountFormProps) {
  const form = useCreateAccountForm(accounts, onCreated)
  return (
    <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          autoComplete="off"
          value={form.name}
          maxLength={ACCOUNT_NAME_MAX_LENGTH}
          onChange={(event) => form.setName(event.target.value)}
          error={form.errors.name}
          nativeUndo
        />
        <Input
          label="Usuario"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={form.username}
          maxLength={USERNAME_MAX_LENGTH}
          hint={TEAM_COPY.usernameHint}
          onChange={(event) => form.setUsername(event.target.value)}
          error={form.errors.username}
          nativeUndo
        />
        <Input
          label="Email (opcional)"
          type="email"
          autoComplete="off"
          value={form.email}
          hint={TEAM_COPY.emailHint}
          onChange={(event) => form.setEmail(event.target.value)}
          error={form.errors.email}
          nativeUndo
        />
        <Select label="Rol" options={ROLE_OPTIONS} value={form.role} onChange={form.setRole} />
      </div>
      <p className="text-sm text-fg-muted">{TEAM_COPY.createHint}</p>
      <Button type="submit" leftIcon={UserPlus} disabled={form.busy} className="self-start">
        Crear cuenta
      </Button>
    </form>
  )
}
