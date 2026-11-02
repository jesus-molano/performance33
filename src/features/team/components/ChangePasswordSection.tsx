import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui'
import { FormError } from '@/features/auth/components/FormError'
import { PasswordFields } from '@/features/auth/components/PasswordFields'
import { TEAM_COPY } from '@/features/team/config'
import { useChangePassword } from '@/features/team/hooks/useChangePassword'

/** 'Mi perfil': closed until asked for, so it does not get in the way of the name and colour. */
export function ChangePasswordSection() {
  const { section, form } = useChangePassword()
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-4">
      <Button variant="secondary" fullWidth leftIcon={KeyRound} aria-expanded={section.isOpen} onClick={section.toggle}>
        {TEAM_COPY.passwordTitle}
      </Button>
      {section.isOpen && (
        <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-3" noValidate>
          <PasswordFields form={form} autoFocus />
          <FormError message={form.error} />
          <Button type="submit" disabled={form.busy}>
            Guardar la contraseña
          </Button>
        </form>
      )}
    </section>
  )
}
