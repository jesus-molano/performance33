import { StyleSheet, View } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/config/theme'
import { AppText } from './AppText'

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<NoticeTone, { background: string; text: string }> = {
  info: { background: COLORS.accentSoft, text: COLORS.accent },
  success: { background: COLORS.successSoft, text: COLORS.success },
  warning: { background: COLORS.warningSoft, text: COLORS.warning },
  danger: { background: COLORS.dangerSoft, text: COLORS.danger },
}

export function Notice({ tone = 'info', message }: { tone?: NoticeTone; message: string }) {
  const colors = TONES[tone]
  return (
    <View accessibilityRole={tone === 'danger' ? 'alert' : undefined} style={[styles.notice, { backgroundColor: colors.background }]}>
      <AppText color={colors.text} style={styles.text}>
        {message}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  notice: { borderRadius: RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, alignSelf: 'stretch' },
  text: { fontWeight: '600' },
})
