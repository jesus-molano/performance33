import { router } from 'expo-router'
import { Linking, Platform, StyleSheet, View } from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { APP_URL, PRIVACY_PATH } from '@/config/app'
import { COPY } from '@/config/copy'
import { SPACING } from '@/config/theme'
import { useSignOut } from '@/features/auth/hooks/useAuthActions'
import { useMember } from '@/features/auth/hooks/useMember'

/** On the web the page sits next to the app; phones open the published one. */
const PRIVACY_URL = Platform.OS === 'web' ? PRIVACY_PATH : `${APP_URL}${PRIVACY_PATH}`

export function ProfileScreen() {
  const member = useMember().data
  const signOut = useSignOut()

  return (
    <Screen edges={['bottom']}>
      {member ? (
        <Card>
          <AppText variant="hero">{member.first_name}</AppText>
          <Row label={COPY.profile.username} value={member.username} />
          <Row label={COPY.profile.email} value={member.email ?? COPY.profile.noEmail} />
        </Card>
      ) : null}
      <AppButton label={COPY.profile.privacy} variant="secondary" onPress={() => void Linking.openURL(PRIVACY_URL)} block />
      <AppButton label={COPY.profile.signOut} loading={signOut.isPending} onPress={() => signOut.mutate()} block />
      <AppButton label={COPY.profile.deleteAccount} variant="ghost" onPress={() => router.push('/borrar-cuenta')} block />
    </Screen>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" muted>
        {label}
      </AppText>
      <AppText variant="large">{value}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: SPACING.xs },
})
