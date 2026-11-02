// How much a day can hold and still read well on the gym TVs (27 inch, 1080p, read from 3-4 m).
// Measured at 3 columns, see "Capacity" in ARCHITECTURE.md before changing them.

export const MAX_BLOCKS_PER_DAY = 5
export const MAX_EXERCISES_PER_BLOCK = 5
export const MAX_EXERCISES_PER_DAY = 16
/** Exercises from which the day's counter turns amber. */
export const NEAR_LIMIT_EXERCISES = 14

/** Fits the longest name in the exercise library, on two lines at most. */
export const EXERCISE_NAME_MAX_LENGTH = 44
/** Two lines on a 3-column TV. */
export const EXERCISE_CUE_MAX_LENGTH = 80
/** Characters left when the field starts showing its counter. */
export const LENGTH_HINT_MARGIN = 6

export const CAPACITY_TEXTS = {
  refusals: {
    blocks: `Máximo ${MAX_BLOCKS_PER_DAY} bloques para que se lea bien en la tele`,
    blockExercises: `Máximo ${MAX_EXERCISES_PER_BLOCK} ejercicios por bloque para que se lea bien en la tele`,
    dayExercises: `Máximo ${MAX_EXERCISES_PER_DAY} ejercicios por día para que se lea bien en la tele`,
  },
  exercises: (count: number) => `${count} de ${MAX_EXERCISES_PER_DAY} ejercicios`,
  blocks: (count: number) => `${count} de ${MAX_BLOCKS_PER_DAY} bloques`,
  overLimit: 'Este día tiene más de lo que se lee bien en la tele. Quita algo o pásalo a otro día.',
  lengthHint: (length: number, max: number) => `${length}/${max} · más largo no se lee bien en la tele`,
  copiedExceptFull: (copied: string, skipped: string) => `Bloque copiado a ${copied}. En ${skipped} no cabía.`,
} as const
