import { Image, StyleSheet } from 'react-native'
import { COPY } from '@/config/copy'

/** logo.png is 1078 × 431. */
const LOGO_RATIO = 431 / 1078

/** The gym's logo, drawn for black backgrounds (white and pink). */
export function Logo({ width = 240 }: { width?: number }) {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      accessibilityRole="image"
      accessibilityLabel={COPY.appName}
      resizeMode="contain"
      style={[styles.logo, { width, height: width * LOGO_RATIO }]}
    />
  )
}

const styles = StyleSheet.create({
  logo: { alignSelf: 'center' },
})
