import { Pressable, ScrollView, StyleSheet } from 'react-native'
import type { GymDate } from '@shared/booking/week.ts'
import { AppText } from '@/components/ui/AppText'
import { COLORS, RADIUS, SPACING, TOUCH_SIZE } from '@/config/theme'
import { dayChipParts, formatDayLabel } from '@/lib/gymDates'

interface DayStripProps {
  days: readonly GymDate[]
  selected: GymDate
  today: GymDate
  onSelect: (day: GymDate) => void
}

/** The days a member can book, side by side: weekday on top, the day of the month below. */
export function DayStrip({ days, selected, today, onSelect }: DayStripProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {days.map((day) => {
        const active = day === selected
        const { weekday, day: number } = dayChipParts(day)
        return (
          <Pressable
            key={day}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={formatDayLabel(day, today)}
            onPress={() => onSelect(day)}
            style={[styles.chip, active && styles.active]}
          >
            <AppText variant="small" color={active ? COLORS.white : COLORS.textMuted}>
              {weekday}
            </AppText>
            <AppText variant="large" color={active ? COLORS.white : COLORS.text}>
              {number}
            </AppText>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  strip: { gap: SPACING.sm, paddingVertical: SPACING.xs },
  chip: {
    minWidth: TOUCH_SIZE + 8,
    minHeight: TOUCH_SIZE + 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  active: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
})
