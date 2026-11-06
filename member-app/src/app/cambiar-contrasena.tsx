import { Logo } from '@/components/ui/Logo'
import { Screen } from '@/components/ui/Screen'
import { GateGuard } from '@/features/auth/components/GateGuard'
import { PasswordChangeForm } from '@/features/auth/components/PasswordChangeForm'

export default function ChangePasswordRoute() {
  return (
    <GateGuard allow={['change-password']} dark>
      <Screen dark centered>
        <Logo width={180} />
        <PasswordChangeForm />
      </Screen>
    </GateGuard>
  )
}
