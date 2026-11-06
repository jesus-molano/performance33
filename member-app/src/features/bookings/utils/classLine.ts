// "Mañana · 18:00 · Entrenamiento": which class a dialog or a button is about (pure).

import type { GymDate, Instant } from '@shared/booking/week.ts'
import { formatDayLabel, formatGymTime } from '@/lib/gymDates'

export function classLine(klass: { gym_date: GymDate; starts_at: Instant; name: string }, today: GymDate): string {
  return `${formatDayLabel(klass.gym_date, today)} · ${formatGymTime(klass.starts_at)} · ${klass.name}`
}
