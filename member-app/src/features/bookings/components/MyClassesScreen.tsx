import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { toGymDate } from '@shared/booking/week.ts'
import { AppButton } from '@/components/ui/AppButton'
import { AppText } from '@/components/ui/AppText'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Screen } from '@/components/ui/Screen'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews'
import { COPY } from '@/config/copy'
import { useNow } from '@/hooks/useNow'
import { useMember } from '@/features/auth/hooks/useMember'
import { refreshBookingData } from '../hooks/useBookingActions'
import { useMyBookings } from '../hooks/useBookingData'
import { useCancelFlow } from '../hooks/useCancelFlow'
import { splitMyBookings } from '../utils/myBookings'
import { MyClassCard } from './MyClassCard'
import { WeekUsage } from './WeekUsage'

export function MyClassesScreen() {
  const now = useNow()
  const today = toGymDate(now)
  const member = useMember()
  const bookings = useMyBookings()
  const cancelFlow = useCancelFlow()
  const queryClient = useQueryClient()
  const { next, others } = splitMyBookings(bookings.data ?? [])

  return (
    <Screen edges={[]} onRefresh={() => void refreshBookingData(queryClient)} refreshing={bookings.isRefetching}>
      {member.data ? <AppText variant="title">{COPY.myClasses.greeting(member.data.first_name)}</AppText> : null}
      <WeekUsage />
      {bookings.isPending ? <LoadingState /> : null}
      {bookings.isError ? <ErrorState message={COPY.common.connection} onRetry={() => void bookings.refetch()} /> : null}
      {bookings.isSuccess && !next && others.length === 0 ? (
        <EmptyState message={COPY.myClasses.empty}>
          <AppButton label={COPY.myClasses.emptyAction} onPress={() => router.navigate('/reservar')} />
        </EmptyState>
      ) : null}
      {next ? (
        <>
          <AppText variant="label" muted>
            {COPY.myClasses.next}
          </AppText>
          <MyClassCard booking={next} today={today} now={now} featured onCancel={cancelFlow.ask} />
        </>
      ) : null}
      {next && others.length > 0 ? (
        <AppText variant="label" muted>
          {COPY.myClasses.others}
        </AppText>
      ) : null}
      {others.map((booking) => (
        <MyClassCard key={booking.booking_id} booking={booking} today={today} now={now} onCancel={cancelFlow.ask} />
      ))}
      <ConfirmDialog {...cancelFlow.dialog} confirmVariant="danger" />
    </Screen>
  )
}
