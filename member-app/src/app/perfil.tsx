import { ProfileScreen } from '@/features/account/components/ProfileScreen'
import { GateGuard } from '@/features/auth/components/GateGuard'

export default function ProfileRoute() {
  return (
    <GateGuard allow={['app']}>
      <ProfileScreen />
    </GateGuard>
  )
}
