import { StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { Logo } from '@/components/ui/Logo'
import { Screen } from '@/components/ui/Screen'
import { COPY } from '@/config/copy'
import { COLORS } from '@/config/theme'
import { useAuth } from '@/features/auth/AuthProvider'
import { GateGuard } from '@/features/auth/components/GateGuard'

export default function OfflineDemoRoute() {
  const { acceptDemo } = useAuth()
  return (
    <GateGuard allow={['offline']} dark>
      <Screen dark centered>
        <Logo />
        <AppText variant="title" color={COLORS.pink} style={styles.center}>
          {COPY.offline.title}
        </AppText>
        <AppText variant="large" color={COLORS.white} style={styles.center}>
          {COPY.offline.body}
        </AppText>
        <AppButton
          label={COPY.offline.start}
          variant="light"
          onPress={() => {
            acceptDemo()
            router.replace('/entrar')
          }}
          block
        />
      </Screen>
    </GateGuard>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
})
