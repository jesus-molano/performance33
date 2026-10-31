import { TV_SLOT_COUNT } from '../../../config/app'
import type { TvSlot } from '../../../lib/routes'
import type { Client } from '../../../types'

/** The first clients with a current routine fill the TV thirds (day 1); the rest stay empty. */
export function pickDefaultTvSlots(clients: readonly Client[]): TvSlot[] {
  const withRoutine = clients.filter((c) => !c.archived && c.currentProgramId)
  return Array.from({ length: TV_SLOT_COUNT }, (_, i) => ({ clientId: withRoutine[i]?.id ?? null, day: 1 }))
}
