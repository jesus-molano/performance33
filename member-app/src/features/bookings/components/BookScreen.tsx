import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { addGymDays, toGymDate } from '@shared/booking/week.ts'
import { hasQuotaLeft } from '@shared/booking/quota.ts'
import { AppText } from '@/components/ui/AppText'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Screen } from '@/components/ui/Screen'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews'
import { COPY } from '@/config/copy'
import { useNow } from '@/hooks/useNow'
import { formatDayLabel, upcomingGymDays } from '@/lib/gymDates'
import { refreshBookingData } from '../hooks/useBookingActions'
import { useBookingSettings, useClassSlots, useMyBookings, useWeekUsage } from '../hooks/useBookingData'
import { useBookFlow } from '../hooks/useBookFlow'
import { waitlistPositions } from '../utils/myBookings'
import { firstDayWithClasses, slotsOfDay, slotView } from '../utils/slotView'
import { DayStrip } from './DayStrip'
import { SlotRow } from './SlotRow'
import { WeekUsage } from './WeekUsage'

export function BookScreen() {
  const now = useNow()
  const today = toGymDate(now)
  const { settings } = useBookingSettings()
  const days = upcomingGymDays(today, settings.horizonDays)
  const slots = useClassSlots(today, addGymDays(today, settings.horizonDays))
  // Until the member picks a day: the first one with a class still to come (in the evening, tomorrow).
  const [picked, setPicked] = useState<string | null>(null)
  const opening = firstDayWithClasses(slots.data ?? [], days, now) ?? today
  // A day left behind (the app stayed open past midnight) falls back to the opening day.
  const selected = picked && days.includes(picked) ? picked : opening
  const usage = useWeekUsage(selected).data
  const quotaUsedUp = usage ? !hasQuotaLeft(usage.quota, usage.used) : false
  const positions = waitlistPositions(useMyBookings().data ?? [])
  const bookFlow = useBookFlow(today, usage ? usage.quota !== null : false)
  const queryClient = useQueryClient()
  const daySlots = slotsOfDay(slots.data ?? [], selected, now)

  return (
    <Screen edges={[]} onRefresh={() => void refreshBookingData(queryClient)} refreshing={slots.isRefetching}>
      <WeekUsage />
      <DayStrip days={days} selected={selected} today={today} onSelect={setPicked} />
      <AppText variant="large">{formatDayLabel(selected, today)}</AppText>
      {slots.isPending ? <LoadingState /> : null}
      {slots.isError ? <ErrorState message={COPY.common.connection} onRetry={() => void slots.refetch()} /> : null}
      {slots.isSuccess && daySlots.length === 0 ? <EmptyState message={COPY.book.noClasses} /> : null}
      {daySlots.map((slot) => {
        const view = slotView(slot, now, settings, { waitlistPosition: positions.get(slot.id) ?? null, quotaUsedUp })
        return <SlotRow key={slot.id} slot={slot} view={view} onPress={() => view.action && bookFlow.ask(slot, view.action === 'waitlist')} />
      })}
      <ConfirmDialog {...bookFlow.dialog} />
    </Screen>
  )
}
