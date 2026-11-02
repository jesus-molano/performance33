import { CircleHelp, LogIn } from 'lucide-react'
import { GoogleIcon } from '@/components/GoogleIcon'
import { Button, Callout, Input } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import { AUTH_COPY } from '@/features/auth/config'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'
import { FormError } from './FormError'

/** Email or username + password, or Google. There is no sign-up: the administrator creates every account. */
export function PasswordLoginForm() {
  const form = useLoginForm()
  const forgot = useDisclosure()
  return (
    <>
      <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email o usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={form.identifier}
          onChange={(event) => form.setIdentifier(event.target.value)}
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
      <div className="flex items-center gap-3 text-sm text-fg-subtle" aria-hidden>
        <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="secondary" size="lg" fullWidth disabled={form.busy} onClick={() => void form.continueWithGoogle()}>
        <GoogleIcon />
        Continuar con Google
      </Button>
      <button
        type="button"
        onClick={forgot.toggle}
        aria-expanded={forgot.isOpen}
        className="min-h-11 self-center text-md font-medium text-brand-strong hover:underline"
      >
        {AUTH_COPY.forgotPassword}
      </button>
      {forgot.isOpen && <Callout icon={CircleHelp}>{AUTH_COPY.forgotPasswordAnswer}</Callout>}
    </>
  )
}
