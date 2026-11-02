import { auth } from '@/auth'
import { useSessionNotice } from '@/store'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { FormError } from '@/features/auth/components/FormError'
import { LocalTestAccounts } from '@/features/auth/components/LocalTestAccounts'
import { PasswordLoginForm } from '@/features/auth/components/PasswordLoginForm'
import { AUTH_COPY } from '@/features/auth/config'

/** Entry screen, the same in every mode. Local test mode also shows its test accounts. */
export function LoginPage() {
  const notice = useSessionNotice()
  return (
    <AuthShell
      title="Entrar"
      description={auth.isLocal ? AUTH_COPY.demoDescription : AUTH_COPY.loginDescription}
      badge={auth.isLocal ? <LocalTestAccounts /> : undefined}
    >
      <FormError message={notice} />
      <PasswordLoginForm />
    </AuthShell>
  )
}
