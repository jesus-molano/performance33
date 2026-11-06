// Phones: the class opened on its own (the one under way or the next) is brought into view once per day shown.

import { useEffect, useRef } from 'react'
import type { GymDate } from '@shared/booking'
import { slotCardDomId } from '@/features/classes/utils/slotView'

export function useScrollToSlot(date: GymDate, slotId: string | null): void {
  const scrolledFor = useRef<GymDate | null>(null)
  useEffect(() => {
    if (!slotId || scrolledFor.current === date) return
    const card = document.getElementById(slotCardDomId(slotId))
    if (!card) return
    scrolledFor.current = date
    card.scrollIntoView({ block: 'start' })
  }, [date, slotId])
}
