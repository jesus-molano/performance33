import { UserPlus } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { ROLE_OPTIONS, STAFF_NAME_MAX_LENGTH, TEAM_COPY } from '@/features/team/config'
import { useAddStaffForm } from '@/features/team/hooks/useAddStaffForm'

/** Gives someone access by email. Nobody can register on their own. */
export function AddStaffForm() {
  const form = useAddStaffForm()
  return (
    <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          autoComplete="off"
          value={form.email}
          onChange={(event) => form.setEmail(event.target.value)}
          error={form.errors.email}
          nativeUndo
        />
        <Input
          label="Nombre"
          autoComplete="off"
          value={form.name}
          maxLength={STAFF_NAME_MAX_LENGTH}
          onChange={(event) => form.setName(event.target.value)}
          error={form.errors.name}
          nativeUndo
        />
      </div>
      <Select label="Rol" options={ROLE_OPTIONS} value={form.role} onChange={form.setRole} />
      <div className="space-y-1 text-sm text-fg-muted">
        <p>{TEAM_COPY.googleHint}</p>
        <p>{TEAM_COPY.passwordHint}</p>
      </div>
      <Button type="submit" leftIcon={UserPlus} disabled={form.busy} className="self-start">
        Añadir al equipo
      </Button>
    </form>
  )
}
