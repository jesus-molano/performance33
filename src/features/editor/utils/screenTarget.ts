// Which day the editor can send to a TV section: TV sections show the client's current routine, so only its days.

import { formatDayTitle } from '@/lib/format'
import type { Client, Day, Program } from '@/types'
import type { SendToScreenInput } from '@/features/screens'

export function dayScreenTarget(
  client: Pick<Client, 'id' | 'currentProgramId'>,
  program: Pick<Program, 'id'>,
  day: Pick<Day, 'name' | 'label'> | null,
  dayIndex: number,
): SendToScreenInput | null {
  if (!day || client.currentProgramId !== program.id) return null
  return { clientId: client.id, day: dayIndex + 1, dayLabel: formatDayTitle(day) }
}
