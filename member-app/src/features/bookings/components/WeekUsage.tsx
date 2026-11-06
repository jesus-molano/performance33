import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui/AppText'
import { COPY } from '@/config/copy'
import { COLORS, RADIUS, SPACING } from '@/config/theme'
import { useWeekUsage } from '../hooks/useBookingData'

/** "Esta semana 1 de 2": the classes used of the plan's weekly ones. */
export function WeekUsage() {
  const { data } = useWeekUsage()
  if (!data) return null
  return (
    <View style={styles.pill}>
      <AppText variant="large" color={COLORS.accent}>
        {COPY.week.usage(data.used, data.quota)}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
})
