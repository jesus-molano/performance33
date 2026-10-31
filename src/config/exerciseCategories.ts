// Library categories, in the order shown in selects and filters.

import type { ExerciseCategory } from '@/types'

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'Piernas',
  'Glúteo',
  'Empuje',
  'Tracción',
  'Hombro',
  'Brazos',
  'Core',
  'Halterofilia',
  'Gimnásticos',
  'Cardio',
  'Pliometría',
  'Movilidad',
]

export const EXERCISE_CATEGORY_OPTIONS = EXERCISE_CATEGORIES.map((category) => ({ value: category, label: category }))
