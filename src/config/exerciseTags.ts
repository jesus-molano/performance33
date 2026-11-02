// How the library classifies an exercise: where it works (muscle, one main plus others) and what kind of training it is.
// Order = order in selects and filters. Search terms are already normalised: lowercase, no accents.

import type { ExerciseType, MuscleGroup } from '@/types'

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  'Pecho',
  'Espalda',
  'Hombro',
  'Bíceps',
  'Tríceps',
  'Antebrazo',
  'Cuádriceps',
  'Femoral',
  'Glúteo',
  'Gemelo',
  'Aductores',
  'Abductores',
  'Core',
  'Cuerpo entero',
]

export const EXERCISE_TYPES: readonly ExerciseType[] = ['Fuerza', 'Halterofilia', 'Gimnásticos', 'Cardio', 'Pliometría', 'Movilidad', 'Calentamiento']

export const DEFAULT_MUSCLE: MuscleGroup = 'Cuerpo entero'
export const DEFAULT_EXERCISE_TYPE: ExerciseType = 'Fuerza'

/** 'Cuerpo entero' only makes sense as the main one. */
export const SECONDARY_MUSCLE_CHOICES: readonly MuscleGroup[] = MUSCLE_GROUPS.filter((muscle) => muscle !== 'Cuerpo entero')

export const MUSCLE_OPTIONS = MUSCLE_GROUPS.map((muscle) => ({ value: muscle, label: muscle }))
export const EXERCISE_TYPE_OPTIONS = EXERCISE_TYPES.map((type) => ({ value: type, label: type }))

/** Words a coach may type for each muscle. Also used to guess the muscle from a new exercise's name. */
export const MUSCLE_SEARCH_TERMS: Readonly<Record<MuscleGroup, readonly string[]>> = {
  Pecho: ['pecho', 'pectoral', 'pectorales'],
  Espalda: ['espalda', 'dorsal', 'dorsales', 'lumbar', 'lumbares', 'trapecio', 'trapecios'],
  Hombro: ['hombro', 'hombros', 'deltoides', 'rotadores'],
  Bíceps: ['biceps'],
  Tríceps: ['triceps'],
  Antebrazo: ['antebrazo', 'antebrazos', 'muneca', 'munecas', 'agarre'],
  Cuádriceps: ['cuadriceps'],
  Femoral: ['femoral', 'femorales', 'isquio', 'isquios', 'isquiotibiales'],
  Glúteo: ['gluteo', 'gluteos'],
  Gemelo: ['gemelo', 'gemelos', 'pantorrilla', 'pantorrillas', 'soleo', 'tibial'],
  Aductores: ['aductor', 'aductores'],
  Abductores: ['abductor', 'abductores'],
  Core: ['core', 'abdomen', 'abdominal', 'abdominales', 'oblicuo', 'oblicuos'],
  'Cuerpo entero': ['cuerpo entero', 'cuerpo completo', 'todo el cuerpo', 'full body'],
}

/** Broader words (the old categories among them) that cover several muscles. */
export const BODY_REGION_TERMS: ReadonlyArray<{ terms: readonly string[]; muscles: readonly MuscleGroup[] }> = [
  { terms: ['pierna', 'piernas'], muscles: ['Cuádriceps', 'Femoral', 'Glúteo', 'Gemelo', 'Aductores', 'Abductores'] },
  { terms: ['brazo', 'brazos'], muscles: ['Bíceps', 'Tríceps', 'Antebrazo'] },
  { terms: ['empuje'], muscles: ['Pecho', 'Hombro', 'Tríceps'] },
  { terms: ['traccion'], muscles: ['Espalda', 'Bíceps'] },
]

export const EXERCISE_TYPE_SEARCH_TERMS: Readonly<Record<ExerciseType, readonly string[]>> = {
  Fuerza: ['fuerza'],
  Halterofilia: ['halterofilia', 'olimpico', 'olimpicos'],
  Gimnásticos: ['gimnasticos', 'gimnastico', 'gimnasia'],
  Cardio: ['cardio'],
  Pliometría: ['pliometria', 'pliometricos', 'plio'],
  Movilidad: ['movilidad', 'estiramientos'],
  Calentamiento: ['calentamiento', 'activacion'],
}
