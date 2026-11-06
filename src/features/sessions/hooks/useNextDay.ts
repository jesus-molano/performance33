// "Le toca": each hook keeps the sessions loaded and live while the component is on screen. Until the first read works
// nobody's next day is known: the hooks answer null (never a made-up Día 1).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toGymDate } from '@shared/booking'
import type { TrainingSession } from '@shared/routine'
import { useAppData, useCurrentProgram } from '@/store'
import { GYM_DAY_TICK_MS } from '@/features/sessions/config/sessions'
import { retainSessions } from '@/features/sessions/store/sessionsConnection'
import { useSessionsStore, type SessionsState } from '@/features/sessions/store/sessionsStore'
import { nextDayOf, nextDaysByClient, ownProgram, type NextDayView } from '@/features/sessions/utils/nextDay'

/** Today in the gym, moved on at midnight (checked every GYM_DAY_TICK_MS). */
function useGymToday(): string {
  const [today, setToday] = useState(() => toGymDate(Date.now()))
  useEffect(() => {
    const timer = setInterval(() => setToday(toGymDate(Date.now())), GYM_DAY_TICK_MS)
    return () => clearInterval(timer)
  }, [])
  return today
}

/** The latest session of each person, or null until a read has worked. */
export function useLatestSessions(): ReadonlyMap<string, TrainingSession> | null {
  useEffect(() => retainSessions(), [])
  return useSessionsStore((s) => (s.known ? s.latest : null))
}

/** Whether the next days are known yet: 'loading' (first read under way), 'failed' (it did not work) or 'known'. */
export type SessionsReadiness = 'loading' | 'failed' | 'known'

const readinessOf = (s: SessionsState): SessionsReadiness => (s.known ? 'known' : s.status === 'error' ? 'failed' : 'loading')

export function useSessionsReadiness(): SessionsReadiness {
  useEffect(() => retainSessions(), [])
  return useSessionsStore(readinessOf)
}

/** The day of their current routine that person does next ('Día 3 · Pierna'); null without one, or not known yet. */
export function useNextDay(clientId: string): NextDayView | null {
  const latest = useLatestSessions()
  const program = ownProgram(useCurrentProgram(clientId), clientId)
  const today = useGymToday()
  return useMemo(() => (latest ? nextDayOf(program, latest.get(clientId) ?? null, today) : null), [clientId, program, latest, today])
}

/** For lists: the next day of anyone (null without a routine, archived, or not known yet). */
export function useNextDayLookup(): (clientId: string) => number | null {
  const latest = useLatestSessions()
  const clients = useAppData((data) => data.clients)
  const programs = useAppData((data) => data.programs)
  const today = useGymToday()
  const days = useMemo(() => (latest ? nextDaysByClient(clients, programs, latest, today) : null), [clients, programs, latest, today])
  return useCallback((clientId: string) => days?.get(clientId) ?? null, [days])
}
