import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { GymDate } from '@shared/booking/week.ts'
import { QUERY_KEYS } from '@/lib/queryClient'
import { backend } from '@/services/backend'
import { buildMemberRoutine } from '../utils/memberRoutine'

/** The member's current routine, formatted like the gym's screens, and the day they do next. */
export function useMyRoutine(today: GymDate) {
  const query = useQuery({ queryKey: QUERY_KEYS.routine, queryFn: () => backend.myRoutine() })
  const routine = useMemo(() => (query.data ? buildMemberRoutine(query.data, today) : null), [query.data, today])
  return { ...query, routine }
}
