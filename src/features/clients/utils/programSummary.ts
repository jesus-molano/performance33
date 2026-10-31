import { plural } from '@/lib/format'
import type { ProgramWeekInfo } from '@/lib/program'
import type { Day, Program } from '@/types'

export function countExercises(day: Day): number {
  return day.blocks.reduce((sum, block) => sum + block.exercises.length, 0)
}

/** '3 bloques · 8 ejercicios' or 'Sin ejercicios todavía'. */
export function formatDayContent(day: Day): string {
  const blocks = day.blocks.length
  if (blocks === 0) return 'Sin ejercicios todavía'
  const exercises = countExercises(day)
  return `${plural(blocks, 'bloque', 'bloques')} · ${plural(exercises, 'ejercicio', 'ejercicios')}`
}

/** '3 días · 4 semanas'. */
export function formatProgramShape(program: Program): string {
  return `${plural(program.days.length, 'día', 'días')} · ${plural(program.weeks, 'semana', 'semanas')}`
}

/** Weeks reached so far: 0 before the start, the current week while active, all once expired. */
export function elapsedWeeks(info: ProgramWeekInfo): number {
  return info.phase === 'upcoming' ? 0 : Math.min(info.week, info.totalWeeks)
}
