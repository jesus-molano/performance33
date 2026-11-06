import { useId, type ComponentRef, type Ref } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { COLORS, FONT, RADIUS, SPACING, TOUCH_SIZE } from '@/config/theme'
import { AppText } from './AppText'

interface TextFieldProps extends Omit<TextInputProps, 'ref'> {
  ref?: Ref<ComponentRef<typeof TextInput>>
  label: string
  hint?: string
  /** Light text on a black background (sign-in). */
  dark?: boolean
}

export function TextField({ label, hint, dark = false, style, ...props }: TextFieldProps) {
  const id = useId()
  return (
    <View style={styles.field}>
      <AppText nativeID={id} variant="large" color={dark ? COLORS.white : undefined}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        aria-labelledby={id}
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, dark && styles.inputDark, style]}
        {...props}
      />
      {hint ? (
        <AppText variant="small" color={dark ? COLORS.pink : COLORS.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: SPACING.xs, alignSelf: 'stretch' },
  input: {
    minHeight: TOUCH_SIZE + 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT.large,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputDark: { borderColor: COLORS.white },
})
