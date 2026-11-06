import { StyleSheet, View } from 'react-native'
import type { MyBookingRow } from '@shared/booking/memberRpc.ts'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { COPY } from '@/config/copy'
import { SPACING } from '@/config/theme'
import { formatDayLabel, formatGymTime } from '@/lib/gymDates'
import { classLine } from '../utils/classLine'
import { canCancel } from '../utils/myBookings'

interface MyClassCardProps {
  booking: MyBookingRow
  today: string
  now: number
  /** The next class: bigger, with the brand border. */
  featured?: boolean
  onCancel: (booking: MyBookingRow) => void
}

export function MyClassCard({ booking, today, now, featured = false, onCancel }: MyClassCardProps) {
  const waiting = booking.status === 'waitlisted'
  const action = waiting ? COPY.myClasses.leaveWaitlist : COPY.myClasses.cancel
  return (
    <Card highlight={featured}>
      <View style={styles.when}>
        <AppText variant={featured ? 'hero' : 'title'}>{formatGymTime(booking.starts_at)}</AppText>
        <AppText variant={featured ? 'title' : 'large'}>{formatDayLabel(booking.gym_date, today)}</AppText>
      </View>
      <AppText variant="large" muted>
        {booking.name}
      </AppText>
      {waiting ? <Notice tone="warning" message={COPY.myClasses.waitlist(booking.waitlist_position)} /> : null}
      {booking.status === 'slot_cancelled' ? <Notice tone="danger" message={COPY.myClasses.cancelledByGym} /> : null}
      {canCancel(booking, now) ? (
        <AppButton
          label={action}
          // With several cards, a screen reader must say which class each button is for.
          accessibilityLabel={`${action}: ${classLine(booking, today)}`}
          variant="secondary"
          onPress={() => onCancel(booking)}
        />
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  when: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.md, flexWrap: 'wrap' },
})
