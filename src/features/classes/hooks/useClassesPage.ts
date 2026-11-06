// The Clases page: the day of the address, its classes, the one picked and the dialog open on it.

import { useState } from 'react'
import { pickFillSlot, toGymDate, type GymDate } from '@shared/booking'
import { useMediaQuery } from '@/hooks'
import { paths, replaceRoute } from '@/lib/routes'
import { CLASSES_TWO_PANES_QUERY } from '@/features/classes/config/classes'
import type { ClassDay, SlotSummary } from '@/features/classes/types'
import { resolveClassDay } from '@/features/classes/utils/dayNav'
import { useClassDay, useClassesClock, type Loaded } from './useClassesData'
import { useScrollToSlot } from './useScrollToSlot'

export type ClassesDialog =
  | { kind: 'create' }
  | { kind: 'edit'; slotId: string }
  | { kind: 'add'; slotId: string }
  | { kind: 'move'; slotId: string; bookingId: string }

export interface ClassesPageApi {
  date: GymDate
  today: GymDate
  /** A day already gone: nothing new can be added to it. */
  isPast: boolean
  now: number
  goTo: (date: GymDate) => void
  day: Loaded<ClassDay>
  slots: SlotSummary[]
  /** The class whose people are shown (side panel) or open (phones). */
  selected: SlotSummary | null
  select: (slotId: string) => void
  twoPanes: boolean
  dialog: ClassesDialog | null
  openDialog: (dialog: ClassesDialog) => void
  closeDialog: () => void
  slotById: (id: string) => SlotSummary | null
}

export function useClassesPage(dayParam: string | null): ClassesPageApi {
  const now = useClassesClock()
  const today = toGymDate(now)
  const date = resolveClassDay(dayParam, today)
  const day = useClassDay(date)
  const twoPanes = useMediaQuery(CLASSES_TWO_PANES_QUERY)
  const [picked, setPicked] = useState<{ date: GymDate; slotId: string | null } | null>(null)
  const [dialog, setDialog] = useState<ClassesDialog | null>(null)

  const slots = day.data?.slots ?? []
  const slotById = (id: string) => slots.find((slot) => slot.id === id) ?? null
  // Nothing picked on this day yet: the class under way or the next one today. The side panel falls back to the first.
  const current = date === today ? pickFillSlot(slots, now) : null
  const fallback = twoPanes ? (current ?? slots[0] ?? null) : current
  const selected = picked?.date === date ? (picked.slotId ? slotById(picked.slotId) : null) : fallback
  useScrollToSlot(date, !twoPanes && picked?.date !== date ? (fallback?.id ?? null) : null)

  return {
    date,
    today,
    isPast: date < today,
    now,
    goTo: (next) => replaceRoute(paths.classes(next === today ? null : next)),
    day,
    slots,
    selected,
    // On phones a second tap closes the class again.
    select: (slotId) => setPicked({ date, slotId: !twoPanes && selected?.id === slotId ? null : slotId }),
    twoPanes,
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    slotById,
  }
}
