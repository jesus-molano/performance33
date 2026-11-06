import type { ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { COPY } from '@/config/copy'
import { COLORS, SPACING } from '@/config/theme'
import { AppButton } from './AppButton'
import { AppText } from './AppText'
import { Notice } from './Notice'

export function LoadingState({ dark = false }: { dark?: boolean }) {
  return (
    <View style={styles.center} accessibilityLabel={COPY.common.loading}>
      <ActivityIndicator size="large" color={dark ? COLORS.pink : COLORS.accent} />
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <Notice tone="danger" message={message} />
      <AppButton label={COPY.common.retry} variant="secondary" onPress={onRetry} />
    </View>
  )
}

export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <View style={styles.error}>
      <AppText variant="large" muted style={styles.emptyText}>
        {message}
      </AppText>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  error: { gap: SPACING.md, alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { textAlign: 'center' },
})
