import { StyleSheet, View } from 'react-native'
import { COPY } from '@/config/copy'
import { COLORS, SPACING } from '@/config/theme'
import { backend } from '@/services/backend'
import { AppText } from './AppText'

/** A strip on every screen of the offline demo, so nobody takes it for the real thing. */
export function DemoBanner() {
  if (backend.mode !== 'demo') return null
  return (
    <View style={styles.banner}>
      <AppText variant="small" color={COLORS.black} style={styles.text}>
        {COPY.offline.banner}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { backgroundColor: COLORS.pink, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.lg },
  text: { textAlign: 'center', fontWeight: '700' },
})
