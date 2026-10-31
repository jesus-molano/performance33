import type { LoadUnit, MeasureType, ProgressionTarget } from '@/types'

export const MEASURE_META: Record<MeasureType, { label: string; short: string }> = {
  reps: { label: 'Reps', short: 'reps' },
  time: { label: 'Tiempo', short: 'tiempo' },
  distance: { label: 'Distancia', short: 'm' },
  calories: { label: 'Calorías', short: 'cal' },
}
export const MEASURE_ORDER: MeasureType[] = ['reps', 'time', 'distance', 'calories']

export const LOAD_UNIT_META: Record<LoadUnit, { label: string; placeholder: string; help: string }> = {
  kg: { label: 'kg', placeholder: '60', help: 'Kilos' },
  pct1rm: { label: '% 1RM', placeholder: '70', help: 'Porcentaje de su máximo a una repetición' },
  rpe: { label: 'RPE', placeholder: '8', help: 'Esfuerzo percibido de 1 a 10 (8 = le quedan 2 reps)' },
  rir: { label: 'RIR', placeholder: '2', help: 'Repeticiones en reserva (0-4)' },
  text: { label: 'Texto', placeholder: 'banda roja, KB 16…', help: 'Texto libre: banda roja, KB 16, peso corporal…' },
}
export const LOAD_UNIT_ORDER: LoadUnit[] = ['kg', 'pct1rm', 'rpe', 'rir', 'text']

export const PROGRESSION_TARGET_META: Record<ProgressionTarget, { label: string }> = {
  load: { label: 'Carga' },
  reps: { label: 'Reps' },
  sets: { label: 'Series' },
  time: { label: 'Tiempo (s)' },
  distance: { label: 'Distancia (m)' },
  calories: { label: 'Calorías' },
}

export const TEMPO_HELP =
  'Tempo: bajar - pausa - subir - pausa. Ej. 3-1-1-0 = 3 s bajar, 1 s pausa, 1 s subir, sin pausa. X = explosivo.'

/** Quick chips under the focused row. */
export const REP_CHIPS = ['5', '8', '10', '12', '15', 'máx'] as const
/** Chip that toggles 'por lado' (appends 'c/lado' to the volume). */
export const PER_SIDE_CHIP_LABEL = 'c/lado'
export const REST_CHIPS: Array<{ label: string; sec: number }> = [
  { label: '30s', sec: 30 },
  { label: '60s', sec: 60 },
  { label: '90s', sec: 90 },
  { label: '2 min', sec: 120 },
]
export const TIME_CHIPS: Array<{ label: string; sec: number }> = [
  { label: '20″', sec: 20 },
  { label: '30″', sec: 30 },
  { label: '45″', sec: 45 },
  { label: '1′', sec: 60 },
]

/** Defaults for a brand-new row when there is no previous row to inherit from. */
export const DEFAULT_SETS = 3
export const DEFAULT_REPS = '10'

/** Default step for the 'aumentar +X por semana' progression helper (kg). */
export const DEFAULT_PROGRESSION_STEP = 2.5
