import { router } from 'expo-router'
import { CircleUserRound } from '@/components/ui/icons'
import { Pressable, StyleSheet } from 'react-native'
import { COPY } from '@/config/copy'
import { COLORS, TOUCH_SIZE } from '@/config/theme'

/** In the header of every tab: opens the profile (sign out, privacy, delete the account). */
export function ProfileButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={COPY.tabs.profile}
      onPress={() => router.push('/perfil')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <CircleUserRound color={COLORS.pink} size={30} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: TOUCH_SIZE, height: TOUCH_SIZE, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  pressed: { opacity: 0.7 },
})
