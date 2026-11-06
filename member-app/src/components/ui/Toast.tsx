// A short message at the bottom after an action ("Reserva hecha"). One at a time.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TOAST_MS } from '@/config/app'
import { COLORS, MAX_CONTENT_WIDTH, RADIUS, SPACING } from '@/config/theme'
import { AppText } from './AppText'

const ToastContext = createContext<(message: string) => void>(() => {})

export const useToast = () => useContext(ToastContext)

/** Above the tab bar. */
const TOAST_BOTTOM_OFFSET = 88

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const insets = useSafeAreaInsets()
  const show = useCallback((text: string) => setMessage(text), [])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [message])

  const value = useMemo(() => show, [show])
  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + TOAST_BOTTOM_OFFSET }]}>
          <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.toast}>
            <AppText color={COLORS.white} style={styles.text}>
              {message}
            </AppText>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: SPACING.lg, right: SPACING.lg, alignItems: 'center' },
  toast: {
    backgroundColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    maxWidth: MAX_CONTENT_WIDTH,
  },
  text: { fontWeight: '600', textAlign: 'center' },
})
