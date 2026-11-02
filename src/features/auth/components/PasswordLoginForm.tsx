import { LogIn } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'
import { FormError } from './FormError'
import { GoogleIcon } from '@/components/GoogleIcon'

/** Email + password and Google. There is no sign-up: the administrator adds people to the team. */
export function PasswordLoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const form = useLoginForm()
  return (
    <>
      <Button variant="secondary" size="lg" fullWidth disabled={form.busy} onClick={() => void form.continueWithGoogle()}>
        <GoogleIcon />
        Continuar con Google
      </Button>
      <div className="flex items-center gap-3 text-sm text-fg-subtle" aria-hidden>
        <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={(event) => form.setEmail(event.target.value)}
          nativeUndo
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => form.setPassword(event.target.value)}
          nativeUndo
        />
        <FormError message={form.error} />
        <Button type="submit" size="lg" fullWidth leftIcon={LogIn} disabled={form.busy}>
          Entrar
        </Button>
      </form>
      <button type="button" onClick={onForgotPassword} className="min-h-11 self-center text-md font-medium text-brand-strong hover:underline">
        He olvidado mi contraseña
      </button>
    </>
  )
}
