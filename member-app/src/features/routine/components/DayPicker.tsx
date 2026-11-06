import { Pressable, ScrollView, StyleSheet } from 'react-native'
import type { DisplayDay } from '@shared/routine/displayTypes.ts'
import { AppText } from '@/components/ui/AppText'
import { COLORS, RADIUS, SPACING, TOUCH_SIZE } from '@/config/theme'

interface DayPickerProps {
  days: readonly DisplayDay[]
  selected: number
  /** The day they do next gets a dot. */
  nextDay: number | null
  onSelect: (day: number) => void
}

export function DayPicker({ days, selected, nextDay, onSelect }: DayPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {days.map((day) => {
        const active = day.number === selected
        return (
          <Pressable
            key={day.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={day.title}
            onPress={() => onSelect(day.number)}
            style={[styles.chip, active && styles.active]}
          >
            <AppText variant="large" color={active ? COLORS.white : COLORS.text}>
              {day.number === nextDay ? `${day.name} •` : day.name}
            </AppText>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  strip: { gap: SPACING.sm },
  chip: {
    minHeight: TOUCH_SIZE,
    minWidth: TOUCH_SIZE,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
})
