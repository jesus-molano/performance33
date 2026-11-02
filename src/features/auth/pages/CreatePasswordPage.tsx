import { KeyRound, LogOut } from 'lucide-react'
import { signOut } from '@/auth'
import { Button } from '@/components/ui'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { FormError } from '@/features/auth/components/FormError'
import { PasswordFields } from '@/features/auth/components/PasswordFields'
import { AUTH_COPY } from '@/features/auth/config'
import { useCreatePassword } from '@/features/auth/hooks/useCreatePassword'
import { useCurrentProfile } from '@/store'

/** First login: nothing else is available (nor readable on the server) until the temporary password is replaced. */
export function CreatePasswordPage() {
  const form = useCreatePassword()
  const expired = useCurrentProfile()?.temporaryPasswordExpired
  if (expired) {
    return (
      <AuthShell title={AUTH_COPY.expiredPasswordTitle} description={AUTH_COPY.expiredPasswordBody}>
        <Button variant="ghost" leftIcon={LogOut} onClick={() => void signOut()} className="self-center">
          Cerrar sesión
        </Button>
      </AuthShell>
    )
  }
  return (
    <AuthShell title={AUTH_COPY.createPasswordTitle} description={AUTH_COPY.createPasswordBody}>
      <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4" noValidate>
        <PasswordFields form={form} autoFocus />
        <FormError message={form.error} />
        <Button type="submit" size="lg" fullWidth leftIcon={KeyRound} disabled={form.busy}>
          Guardar y entrar
        </Button>
      </form>
      <Button variant="ghost" leftIcon={LogOut} onClick={() => void signOut()} className="self-center">
        Cerrar sesión
      </Button>
    </AuthShell>
  )
}
