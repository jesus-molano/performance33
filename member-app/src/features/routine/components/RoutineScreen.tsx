import { useState } from 'react'
import { toGymDate } from '@shared/booking/week.ts'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews'
import { COPY } from '@/config/copy'
import { COLORS } from '@/config/theme'
import { useNow } from '@/hooks/useNow'
import { useMyRoutine } from '../hooks/useMyRoutine'
import { DayPicker } from './DayPicker'
import { RoutineBlock } from './RoutineBlock'

export function RoutineScreen() {
  const today = toGymDate(useNow())
  const query = useMyRoutine(today)
  const [picked, setPicked] = useState<number | null>(null)
  const memberRoutine = query.routine
  const nextDay = memberRoutine?.next?.day ?? null
  const routine = memberRoutine?.routine
  const dayNumber = picked ?? nextDay ?? 1
  const day = routine?.days.find((d) => d.number === dayNumber) ?? routine?.days[0]
  const nextTitle = routine?.days.find((d) => d.number === nextDay)?.title

  return (
    <Screen edges={[]} onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      {query.isPending ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={COPY.common.connection} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && !routine ? <EmptyState message={COPY.routine.none} /> : null}
      {routine ? (
        <>
          {nextTitle ? (
            <Card highlight>
              <AppText variant="title" color={COLORS.accent}>
                {COPY.routine.today(nextTitle)}
              </AppText>
              <AppText muted>{routine.weekLabel}</AppText>
            </Card>
          ) : null}
          <DayPicker days={routine.days} selected={day?.number ?? 1} nextDay={nextDay} onSelect={setPicked} />
          {day ? <AppText variant="title">{day.title}</AppText> : null}
          {day && day.blocks.length === 0 ? <EmptyState message={COPY.routine.noBlocks} /> : null}
          {day?.blocks.map((block) => <RoutineBlock key={block.id} block={block} />)}
        </>
      ) : null}
    </Screen>
  )
}
