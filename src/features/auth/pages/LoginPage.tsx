import { FlaskConical } from 'lucide-react'
import { auth } from '@/auth'
import { Badge } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import { useSessionNotice } from '@/store'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'
import { FormError } from '@/features/auth/components/FormError'
import { LocalDemoLogin } from '@/features/auth/components/LocalDemoLogin'
import { PasswordLoginForm } from '@/features/auth/components/PasswordLoginForm'

/** Entry screen. Local test mode shows its demo buttons instead of the real forms. */
export function LoginPage() {
  const forgot = useDisclosure()
  const notice = useSessionNotice()
  const { demoSignIn } = auth

  if (demoSignIn) {
    return (
      <AuthShell
        title="Entrar"
        description="Prueba la aplicación con datos de demostración, guardados solo en este navegador."
        badge={
          <Badge tone="warning" icon={FlaskConical}>
            Modo local de pruebas
          </Badge>
        }
      >
        <LocalDemoLogin onEnter={(role) => void demoSignIn(role)} />
      </AuthShell>
    )
  }

  if (forgot.isOpen) {
    return (
      <AuthShell title="Recupera tu contraseña" description="Te enviaremos un enlace para elegir una nueva.">
        <ForgotPasswordForm onBack={forgot.close} />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Entrar" description="Usa tu cuenta del equipo del gimnasio.">
      <FormError message={notice} />
      <PasswordLoginForm onForgotPassword={forgot.open} />
    </AuthShell>
  )
}
