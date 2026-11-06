import { StyleSheet } from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { Logo } from '@/components/ui/Logo'
import { Screen } from '@/components/ui/Screen'
import { COPY } from '@/config/copy'
import { COLORS } from '@/config/theme'
import { GateGuard } from '@/features/auth/components/GateGuard'
import { useGate } from '@/features/auth/hooks/useGate'
import { useSignOut } from '@/features/auth/hooks/useAuthActions'

/** Signed in, but nothing to show: no account (or paused), or a temporary password that expired. */
export default function NoAccessRoute() {
  const { gate } = useGate()
  const signOut = useSignOut()
  const expired = gate === 'expired'
  return (
    <GateGuard allow={['no-access', 'expired']} dark>
      <Screen dark centered>
        <Logo width={180} />
        <AppText variant="title" color={COLORS.pink} style={styles.center}>
          {expired ? COPY.access.expiredTitle : COPY.access.noAccessTitle}
        </AppText>
        <AppText variant="large" color={COLORS.white} style={styles.center}>
          {expired ? COPY.access.expiredBody : COPY.access.noAccessBody}
        </AppText>
        <AppButton label={COPY.access.signOut} variant="light" loading={signOut.isPending} onPress={() => signOut.mutate()} block />
      </Screen>
    </GateGuard>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
})
