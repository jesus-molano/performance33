import type { ComponentRef, Ref } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native'
import { COLORS, FONT, RADIUS, SPACING, TOUCH_SIZE } from '@/config/theme'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'light'

interface AppButtonProps extends Omit<PressableProps, 'children' | 'style' | 'ref'> {
  ref?: Ref<ComponentRef<typeof Pressable>>
  label: string
  variant?: ButtonVariant
  loading?: boolean
  /** Fills the width of its container. */
  block?: boolean
}

const VARIANTS: Record<ButtonVariant, { background: string; text: string; border: string }> = {
  primary: { background: COLORS.accent, text: COLORS.white, border: COLORS.accent },
  secondary: { background: COLORS.white, text: COLORS.accent, border: COLORS.accent },
  danger: { background: COLORS.danger, text: COLORS.white, border: COLORS.danger },
  ghost: { background: 'transparent', text: COLORS.accent, border: 'transparent' },
  /** On black backgrounds (sign-in). */
  light: { background: COLORS.pink, text: COLORS.black, border: COLORS.pink },
}

export function AppButton({ label, variant = 'primary', loading = false, block = false, disabled, ...props }: AppButtonProps) {
  const colors = VARIANTS[variant]
  const inactive = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.background, borderColor: colors.border },
        block && styles.block,
        pressed && styles.pressed,
        inactive && styles.inactive,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={colors.text} /> : null}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH_SIZE,
    minWidth: TOUCH_SIZE,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  block: { alignSelf: 'stretch' },
  label: { fontSize: FONT.body, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.8 },
  inactive: { opacity: 0.55 },
})
