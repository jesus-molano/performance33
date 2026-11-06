import { Pressable, StyleSheet, View } from 'react-native'
import type { ClassSlotListRow } from '@shared/booking/rpc.ts'
import { AppText } from '@/components/ui/AppText'
import { COLORS, RADIUS, SPACING, TOUCH_SIZE } from '@/config/theme'
import { formatGymTime } from '@/lib/gymDates'
import type { SlotTone, SlotView } from '../utils/slotView'

interface SlotRowProps {
  slot: ClassSlotListRow
  view: SlotView
  onPress: () => void
}

const TONE_COLORS: Record<SlotTone, { text: string; border: string; background: string }> = {
  mine: { text: COLORS.success, border: COLORS.success, background: COLORS.successSoft },
  mineWaiting: { text: COLORS.warning, border: COLORS.warning, background: COLORS.warningSoft },
  open: { text: COLORS.accent, border: COLORS.border, background: COLORS.white },
  waitlist: { text: COLORS.warning, border: COLORS.border, background: COLORS.white },
  muted: { text: COLORS.textMuted, border: COLORS.border, background: COLORS.surface },
}

/** A class of the day: time, name and what is left. Tappable only when there is something to do. */
export function SlotRow({ slot, view, onPress }: SlotRowProps) {
  const colors = TONE_COLORS[view.tone]
  const time = formatGymTime(slot.starts_at)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${time}, ${slot.name}, ${view.label}`}
      accessibilityState={{ disabled: view.action === null }}
      disabled={view.action === null}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed]}
    >
      <AppText variant="title" style={styles.time} color={view.tone === 'muted' ? COLORS.textMuted : COLORS.text}>
        {time}
      </AppText>
      <View style={styles.info}>
        <AppText variant="large" color={view.tone === 'muted' ? COLORS.textMuted : COLORS.text}>
          {slot.name}
        </AppText>
        <AppText color={colors.text} style={styles.label}>
          {view.label}
        </AppText>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH_SIZE + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  time: { minWidth: 72 },
  info: { flex: 1, gap: 2 },
  label: { fontWeight: '700' },
  pressed: { opacity: 0.8 },
})
