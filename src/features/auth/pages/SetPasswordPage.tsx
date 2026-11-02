import { KeyRound } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { FormError } from '@/features/auth/components/FormError'
import { PASSWORD_MIN_LENGTH } from '@/features/auth/config'
import { useSetPassword } from '@/features/auth/hooks/useSetPassword'

/** Where the password-reset link lands. */
export function SetPasswordPage() {
  const form = useSetPassword()
  return (
    <AuthShell title="Elige una contraseña nueva" description={`Al menos ${PASSWORD_MIN_LENGTH} caracteres.`}>
      <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => form.setPassword(event.target.value)}
          autoFocus
          nativeUndo
        />
        <Input
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          value={form.repeated}
          onChange={(event) => form.setRepeated(event.target.value)}
          nativeUndo
        />
        <FormError message={form.error} />
        <Button type="submit" size="lg" fullWidth leftIcon={KeyRound} disabled={form.busy}>
          Guardar y entrar
        </Button>
      </form>
    </AuthShell>
  )
}
