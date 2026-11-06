import { StyleSheet, Text, type TextProps } from 'react-native'
import { COLORS, FONT } from '@/config/theme'

export type TextVariant = 'hero' | 'title' | 'large' | 'body' | 'small' | 'label'

interface AppTextProps extends TextProps {
  variant?: TextVariant
  muted?: boolean
  color?: string
}

export function AppText({ variant = 'body', muted = false, color, style, ...props }: AppTextProps) {
  return <Text style={[styles.base, styles[variant], muted && styles.muted, color ? { color } : null, style]} {...props} />
}

const styles = StyleSheet.create({
  base: { color: COLORS.text, fontSize: FONT.body, lineHeight: FONT.body * 1.35 },
  hero: { fontSize: FONT.hero, lineHeight: FONT.hero * 1.15, fontWeight: '800' },
  title: { fontSize: FONT.title, lineHeight: FONT.title * 1.2, fontWeight: '700' },
  large: { fontSize: FONT.large, lineHeight: FONT.large * 1.3, fontWeight: '600' },
  body: {},
  small: { fontSize: FONT.small, lineHeight: FONT.small * 1.35 },
  label: { fontSize: FONT.small, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  muted: { color: COLORS.textMuted },
})
