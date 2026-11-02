import { ArrowLeft, Mail } from 'lucide-react'
import { Button, Callout, Input } from '@/components/ui'
import { AUTH_COPY } from '@/features/auth/config'
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword'
import { FormError } from './FormError'

/** Asks for the reset email; replaces the login form on the same card. */
export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const form = useForgotPassword()
  return (
    <>
      {form.sent ? (
        <Callout icon={Mail}>{AUTH_COPY.resetSent}</Callout>
      ) : (
        <form onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            autoFocus
            nativeUndo
          />
          <FormError message={form.error} />
          <Button type="submit" size="lg" fullWidth leftIcon={Mail} disabled={form.busy}>
            Enviarme el enlace
          </Button>
        </form>
      )}
      <Button variant="ghost" leftIcon={ArrowLeft} onClick={onBack} className="self-center">
        Volver
      </Button>
    </>
  )
}
