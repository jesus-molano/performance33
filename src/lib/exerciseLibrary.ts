// Pure helpers shared by the library manager (Ajustes) and 'Guardar en biblioteca' (editor).

import type { AnyLibraryExercise } from '@/types'

/** 'a, b ,, c' → ['a', 'b', 'c']. */
export function splitList(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

/** 'Piernas · Kettlebell, Banco'. */
export function formatExerciseMeta(exercise: Pick<AnyLibraryExercise, 'category' | 'equipment'>): string {
  return [exercise.category, exercise.equipment.join(', ')].filter(Boolean).join(' · ')
}
