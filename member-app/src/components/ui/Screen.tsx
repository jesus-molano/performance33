import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { COLORS, MAX_CONTENT_WIDTH, SPACING } from '@/config/theme'
import { DemoBanner } from './DemoBanner'

interface ScreenProps {
  children: ReactNode
  /** Black background with light text (sign-in and the screens around it). */
  dark?: boolean
  /** Pull to refresh. */
  onRefresh?: () => void
  refreshing?: boolean
  /** Inside the tabs the bottom edge belongs to the tab bar. */
  edges?: Edge[]
  /** Vertically centred content (short screens such as sign-in). */
  centered?: boolean
}

export function Screen({ children, dark = false, onRefresh, refreshing = false, edges = ['top', 'bottom'], centered = false }: ScreenProps) {
  const background = dark ? COLORS.black : COLORS.surface
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: background }]}>
      <DemoBanner />
      <ScrollView
        contentContainerStyle={[styles.scroll, centered && styles.centered]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} /> : undefined}
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl },
  centered: { justifyContent: 'center' },
  content: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', gap: SPACING.lg },
})
