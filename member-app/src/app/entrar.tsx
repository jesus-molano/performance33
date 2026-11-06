import { Logo } from '@/components/ui/Logo'
import { Screen } from '@/components/ui/Screen'
import { GateGuard } from '@/features/auth/components/GateGuard'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginRoute() {
  return (
    <GateGuard allow={['login']} dark>
      <Screen dark centered>
        <Logo />
        <LoginForm />
      </Screen>
    </GateGuard>
  )
}
