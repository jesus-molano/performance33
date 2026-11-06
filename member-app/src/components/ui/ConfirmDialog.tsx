// A centred question with two big buttons. Alert.alert has no buttons on the web, so the app uses this everywhere.

import { useId, useRef, type ComponentRef } from 'react'
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { COLORS, MAX_CONTENT_WIDTH, RADIUS, SPACING } from '@/config/theme'
import { AppButton, type ButtonVariant } from './AppButton'
import { AppText } from './AppText'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  /** Lines under the title (what happens, what it costs). */
  body?: readonly string[]
  confirmLabel: string
  cancelLabel: string
  confirmVariant?: ButtonVariant
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  visible,
  title,
  body = [],
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null)
  // On the web, focus goes to the safe answer, so Enter never confirms by accident. On phones the screen reader
  // starts on the title by itself.
  const focusSafeAnswer = () => {
    if (Platform.OS === 'web') cancelRef.current?.focus()
  }
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} onShow={focusSafeAnswer}>
      <View style={styles.overlay}>
        {/* Tapping outside closes it; screen readers use the buttons instead. */}
        <Pressable style={styles.backdrop} onPress={busy ? undefined : onCancel} accessible={false} tabIndex={-1} aria-hidden />
        <View style={styles.sheet} role="dialog" aria-modal aria-labelledby={titleId} accessibilityViewIsModal>
          <AppText nativeID={titleId} variant="title">
            {title}
          </AppText>
          {body.map((line) => (
            <AppText key={line} variant="large" muted>
              {line}
            </AppText>
          ))}
          <View style={styles.actions}>
            <AppButton label={confirmLabel} variant={confirmVariant} loading={busy} onPress={onConfirm} block />
            <AppButton ref={cancelRef} label={cancelLabel} variant="ghost" disabled={busy} onPress={onCancel} block />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  actions: { gap: SPACING.sm, marginTop: SPACING.sm },
})
