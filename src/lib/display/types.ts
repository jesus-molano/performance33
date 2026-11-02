import type { BlockType, Branding, ISODate } from '@/types'
import type { ProgramPhase } from '@/lib/program'

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

/** A client's routine fully formatted for the TV. Contains no private data. */
export interface DisplayRoutine {
  branding: Branding
  clientId: string
  clientFirstName: string
  clientColor: string
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
