import { StyleSheet, View, type ViewProps } from 'react-native'
import { COLORS, RADIUS, SPACING } from '@/config/theme'

interface CardProps extends ViewProps {
  /** Brand-coloured border: the member's own class, the day they do next. */
  highlight?: boolean
}

export function Card({ highlight = false, style, ...props }: CardProps) {
  return <View style={[styles.card, highlight && styles.highlight, style]} {...props} />
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  highlight: { borderColor: COLORS.accent, borderWidth: 2 },
})
