// Editor-only constants (labels, defaults, interaction thresholds).

import { DEFAULT_PROGRESSION_STEP } from '@/config/exerciseFields'
import type { MeasureType, ProgressionTarget } from '@/types'

/** Quick focus labels offered under the day name. */
export const DAY_LABEL_SUGGESTIONS = ['Pierna', 'Empuje', 'Tracción', 'Torso', 'Full body', 'Core', 'Cardio'] as const

/** Max library matches shown in the exercise autocomplete. */
export const SEARCH_RESULT_LIMIT = 8

/** Default value written when a row switches to a measure that has no value yet. */
export const MEASURE_DEFAULTS: Record<Exclude<MeasureType, 'reps'>, number> = {
  time: 30,
  distance: 400,
  calories: 12,
}

/** Default step of the 'Rellenar +X por semana' helper, per progression target. */
export const PROGRESSION_STEP_DEFAULTS: Record<ProgressionTarget, number> = {
  load: DEFAULT_PROGRESSION_STEP,
  reps: 1,
  sets: 1,
  time: 5,
  distance: 100,
  calories: 2,
}

/** Drag activation: a small move with the mouse, a short press on touch (so scrolling still works). */
export const POINTER_ACTIVATION_DISTANCE = 6
export const TOUCH_ACTIVATION = { delay: 180, tolerance: 8 } as const

/** Wide screens show the live TV preview next to the editor. */
export const WIDE_MEDIA_QUERY = '(min-width: 1280px)'
export const PREVIEW_STORAGE_KEY = 'p33:editor:preview'

export const SECONDS_PER_MINUTE = 60

/** Spanish screen-reader texts for drag and drop. */
export const DND_TEXTS = {
  instructions:
    'Pulsa espacio o intro para coger el elemento. Usa las flechas para moverlo y espacio o intro para soltarlo. Escape cancela.',
  start: 'Elemento cogido.',
  over: 'Moviendo.',
  end: 'Elemento soltado.',
  cancel: 'Movimiento cancelado.',
} as const

/** Bottom-sheet title while the open row has no name yet. */
export const NEW_EXERCISE_TITLE = 'Nuevo ejercicio'

/** Placeholder of a warm-up / mobility block's free text. */
export const BLOCK_TEXT_PLACEHOLDER = 'Ej.\n5′ bici suave\n2 rondas: 10 sentadillas, 10 puentes de glúteo, 5 flexiones'

export const PREVIEW_FIT_WARNING =
  'Hay demasiado contenido para leerse bien en la tele: divide el bloque o pasa ejercicios a otro día.'

export const PREVIEW_DETAIL_HIDDEN_NOTE =
  'Para que se lea bien, en la tele se ocultan las indicaciones, el tempo o las notas de este día.'

/** Summary text of a row that has no name yet. */
export const UNNAMED_EXERCISE = 'Ejercicio sin nombre'

/** Highlight of a list opened by focus alone: Enter and Escape keep their normal meaning. */
export const NO_HIGHLIGHT = -1
