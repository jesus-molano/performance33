import { KeyRound } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { FormError } from '@/features/auth/components/FormError'
import { PasswordFields } from '@/features/auth/components/PasswordFields'
import { TEAM_COPY } from '@/features/team/config'
import { useChangePassword } from '@/features/team/hooks/useChangePassword'

export interface ChangePasswordSectionProps {
  hasOwnPassword: boolean
}

/** 'Mi perfil': closed until asked for, so it does not get in the way of the name and colour. */
export function ChangePasswordSection({ hasOwnPassword }: ChangePasswordSectionProps) {
  const { section, form, currentPassword, setCurrentPassword } = useChangePassword(hasOwnPassword)
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-4">
      <Button variant="secondary" fullWidth leftIcon={KeyRound} aria-expanded={section.isOpen} onClick={section.toggle}>
        {TEAM_COPY.passwordTitle}
      </Button>
      {section.isOpen && (
        <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-3" noValidate>
          {hasOwnPassword && (
            <Input
              label={TEAM_COPY.currentPassword}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoFocus
              nativeUndo
            />
          )}
          <PasswordFields form={form} autoFocus={!hasOwnPassword} />
          <FormError message={form.error} />
          <Button type="submit" disabled={form.busy}>
            Guardar la contraseña
          </Button>
        </form>
      )}
    </section>
  )
}
