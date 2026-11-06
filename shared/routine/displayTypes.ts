// A routine already formatted for reading: the TV, Pantalla, the live preview and the members' app all show this.

import type { ProgramPhase } from './programWeek.ts'
import type { BlockType, ISODate } from './types.ts'

/** One exercise row, already formatted for the screen. */
export interface DisplayExerciseLine {
  id: string
  /** 'A1', '1', 'Min 1' or null. */
  label: string | null
  name: string
  /** '4 × 8-10', '30″', '400 m', '12 cal', '10 c/lado'. */
  volume: string
  /** '60 kg', '70% (56 kg)', 'RPE 8', 'banda roja' or ''. */
  load: string
  /** 'tempo 3-1-1-0 · desc. 90s' or ''. */
  detail: string
  /** Client-visible cue or ''. */
  cue: string
}

export interface DisplayBlock {
  id: string
  type: BlockType
  /** 'A', 'B'… among the main blocks (matches the A1/A2 labels); null for warm-up/mobility. */
  letter: string | null
  title: string
  headline: string
  badge?: string
  chip?: string
  subtitle?: string
  footer?: string
  /** Client-visible note or ''. */
  note: string
  /** Client-visible free text (warm-up/mobility) or ''. */
  text: string
  /** Warm-up/mobility → render dimmer/outlined. */
  muted: boolean
  exercises: DisplayExerciseLine[]
}

export interface DisplayDay {
  id: string
  /** 1-based position (matches ?dia=). */
  number: number
  name: string
  label: string
  /** 'Día 2 · Pierna'. */
  title: string
  blocks: DisplayBlock[]
}

/** A routine fully formatted, without the person or the branding (the web adds them). Contains no private data. */
export interface ProgramRoutine {
  programId: string
  programName: string
  startDate: ISODate
  endDate: ISODate
  phase: ProgramPhase
  /** Week whose progression values apply (1..totalWeeks), null outside the program's dates. */
  week: number | null
  totalWeeks: number
  /** 'Semana 2 de 4', 'Empieza el 03/11/2026' or 'Rutina finalizada'. */
  weekLabel: string
  days: DisplayDay[]
}
