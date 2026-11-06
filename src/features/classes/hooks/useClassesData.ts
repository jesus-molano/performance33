// Reading classes: each hook keeps its data loaded and live while the component is on screen.

import { useEffect, useMemo, useState } from 'react'
import { BOOKING_DEFAULTS, type BookingSettings, type GymDate } from '@shared/booking'
import { useClients } from '@/store'
import type { PlanId } from '@/types'
import { CLASSES_CLOCK_TICK_MS } from '@/features/classes/config/classes'
import { reloadClasses, retainClasses } from '@/features/classes/store/classesConnection'
import { EMPTY_RESOURCE, useClassesStore, type ResourceStatus } from '@/features/classes/store/classesStore'
import type { ClassDay, ClassSchedule, ClientClasses } from '@/features/classes/types'
import { planDescriptions } from '@/features/classes/utils/planQuota'
import type { RosterClient } from '@/features/classes/utils/slotView'

export interface Loaded<T> {
  status: ResourceStatus
  data: T | null
  retry: () => void
}

const retry = () => void reloadClasses()

/** The current time, moved on every CLASSES_CLOCK_TICK_MS (class states change with it). */
export function useClassesClock(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLASSES_CLOCK_TICK_MS)
    return () => clearInterval(timer)
  }, [])
  return now
}

export function useClassDay(date: GymDate): Loaded<ClassDay> {
  useEffect(() => retainClasses({ kind: 'day', date }), [date])
  const resource = useClassesStore((s) => s.days[date] ?? EMPTY_RESOURCE)
  return { status: resource.status, data: resource.data, retry }
}

export function useClassSchedule(): Loaded<ClassSchedule> {
  useEffect(() => retainClasses({ kind: 'schedule' }), [])
  const resource = useClassesStore((s) => s.schedule)
  return { status: resource.status, data: resource.data, retry }
}

export function useClientClasses(clientId: string): Loaded<ClientClasses> {
  useEffect(() => retainClasses({ kind: 'client', clientId }), [clientId])
  const resource = useClassesStore((s) => s.clients[clientId] ?? EMPTY_RESOURCE)
  return { status: resource.status, data: resource.data, retry }
}

/** The gym's booking rules (the defaults until they are read). */
export function useBookingSettings(): BookingSettings {
  return useClassSchedule().data?.settings ?? BOOKING_DEFAULTS
}

/** '2 clases/semana' for every plan, from the gym's rules. */
export function usePlanDescriptions(): Record<PlanId, string> {
  const settings = useBookingSettings()
  return useMemo(() => planDescriptions(settings), [settings])
}

/** Every user by id, archived ones too (an archived person can still be in a class). */
export function useRosterClients(): ReadonlyMap<string, RosterClient> {
  const clients = useClients({ includeArchived: true })
  return useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
}
