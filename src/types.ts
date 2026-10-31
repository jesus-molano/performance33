// ─────────────────────────────────────────────────────────────────────────────
// Domain types for Performance33 · Rutinas.
// Everything persisted lives under AppData. Dates are local calendar dates as
// 'YYYY-MM-DD' strings (ISODate); timestamps are full ISO strings (ISODateTime).
// PRIVATE fields (never shown on the TV/display): ClientNote (all of it),
// ExerciseEntry.internalNote, Client.lastName, Client.goal.
// ─────────────────────────────────────────────────────────────────────────────


/** Local calendar date, 'YYYY-MM-DD'. */
export type ISODate = string
/** Full timestamp, new Date().toISOString(). */
export type ISODateTime = string
export type ID = string

// ── Coaches ─────────────────────────────────────────────────────────────────

export interface Coach {
  id: ID
  name: string
  /** Hex colour for avatar, e.g. '#d6449a'. */
  color: string
}

// ── Clients ─────────────────────────────────────────────────────────────────

export type PlanId = 'standard' | 'plus' | 'elite' | 'custom'

export interface Client {
  id: ID
  firstName: string
  /** PRIVATE: never sent to the display. */
  lastName: string
  plan: PlanId
  /** Training days per week (1-6). Default number of days for a new program. */
  trainingDays: number
  /** Date the client joined. */
  startDate: ISODate
  /** PRIVATE: goal, e.g. 'Perder grasa y ganar fuerza'. */
  goal: string
  /** Avatar colour (hex). Initials are derived from the name. */
  color: string
  archived: boolean
  /** The program shown by default on the TV and on the client card. */
  currentProgramId: ID | null
  createdAt: ISODateTime
}

/** PRIVATE: per-client internal note (health info etc.). */
export interface ClientNote {
  id: ID
  clientId: ID
  /** Coach id of the author (may refer to a deleted coach; show 'Monitor eliminado'). */
  authorId: ID
  text: string
  /** Pinned = shown as an alert badge/banner on the client. */
  pinned: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

// ── Programs (rutinas de ~4 semanas) ─────────────────────────

export interface Program {
  id: ID
  clientId: ID
  /** Optional name, e.g. 'Fuerza otoño'. Empty → UI shows 'Rutina del <fecha>'. */
  name: string
  startDate: ISODate
  /** Inclusive last day. Kept consistent with weeks by store.setProgramDates. */
  endDate: ISODate
  /** Number of weeks (≥1). Drives the number of progression slots S1..SN. */
  weeks: number
  days: Day[]
  createdAt: ISODateTime
  /** Coach id who created it. */
  createdBy: ID | null
}

export interface Day {
  id: ID
  /** e.g. 'Día 1'. Editable. */
  name: string
  /** Optional focus label, e.g. 'Pierna', 'Empuje'. */
  label: string
  blocks: Block[]
}

// ── Blocks ──────────────────────────────────────────────────────────────────

export type BlockType =
  | 'normal' // Series fijas
  | 'superset' // Superserie / Biserie / Triserie (A1, A2…)
  | 'circuit' // Circuito N rondas
  | 'emom' // Cada X min durante Y min
  | 'amrap' // Máximas rondas en X min
  | 'tabata' // Tabata / Intervalos trabajo/descanso × rondas
  | 'fortime' // Por tiempo (time cap)
  | 'warmup' // Calentamiento
  | 'cooldown' // Movilidad / Vuelta a la calma

/**
 * Flat bag of optional params. Every block keeps all of them so that changing
 * the block type never loses data; BLOCK_TYPE_META[type].params says which
 * ones are shown/used for each type.
 */
export interface BlockParams {
  /** superset: series; circuit/fortime/tabata: rondas. */
  rounds?: number
  /** EMOM: every X minutes (default 1). */
  everyMin?: number
  /** EMOM: total minutes. warmup/cooldown: optional duration in minutes. */
  durationMin?: number
  /** AMRAP: minutes. fortime: time cap minutes. */
  timeCapMin?: number
  /** tabata: work seconds. */
  workSec?: number
  /** tabata: rest seconds. */
  restSec?: number
  /** superset/circuit/fortime: rest between rounds (seconds). */
  restBetweenRoundsSec?: number
  /** circuit: rest between exercises (seconds). */
  restBetweenExercisesSec?: number
  /** fortime (also circuit): rep scheme chip, e.g. '21-15-9'. */
  repScheme?: string
}

export interface Block {
  id: ID
  type: BlockType
  /** Custom title. '' = automatic title from type (see getBlockTitle). */
  title: string
  params: BlockParams
  /** Client-visible note, e.g. 'Mantén técnica limpia'. */
  note: string
  /** Client-visible free text (mainly warmup/cooldown), multi-line. */
  text: string
  exercises: ExerciseEntry[]
}

// ── Exercise rows ───────────────────────────────────────────────────────────

export type LoadUnit = 'kg' | 'pct1rm' | 'rpe' | 'rir' | 'text'

/** Which value the weekly progression overrides. */
export type ProgressionTarget = 'load' | 'reps' | 'sets' | 'time' | 'distance' | 'calories'

export interface Progression {
  target: ProgressionTarget
  /**
   * values[i] = value for week i+1 (S1..SN). '' = use the base value.
   * Same format as the target field (load uses the row's loadUnit, e.g. '22.5').
   */
  values: string[]
}

export interface ExerciseEntry {
  id: ID
  /** Library id (built-in or custom) when picked from the library; null = free text. */
  libraryId: string | null
  name: string
  measure: MeasureType
  /** Series. null = not shown (e.g. inside circuits where rounds are block-level). */
  sets: number | null
  /** Free text: '8', '8-10', 'máx', '21-15-9'. Used when measure = 'reps'. */
  reps: string
  /** Seconds. Used when measure = 'time'. */
  durationSec: number | null
  /** Metres. Used when measure = 'distance'. */
  distanceM: number | null
  /** Used when measure = 'calories'. */
  calories: number | null
  /** Free-text value in loadUnit: '60', '70', '8', 'banda roja', 'KB 16'. '' = none. */
  load: string
  loadUnit: LoadUnit
  /** Optional client 1RM (kg) for this exercise, to show '70% (56 kg)'. */
  rmKg: number | null
  /** 'E-P-C-P' tempo, e.g. '3-1-1-0' or '31X0'. '' = none. */
  tempo: string
  /** Rest between sets, seconds. null = none. */
  restSec: number | null
  /** Appends ' c/lado'. */
  perSide: boolean
  /** Client-visible cue ('indicación'), e.g. 'codos pegados'. */
  cue: string
  /** PRIVATE: coach-only note. Never rendered on the display. */
  internalNote: string
  progression: Progression | null
}

// ── Library ─────────────────────────────────────────────────────────────────

export type ExerciseCategory =
  | 'Piernas'
  | 'Empuje'
  | 'Tracción'
  | 'Core'
  | 'Halterofilia'
  | 'Cardio'
  | 'Gimnásticos'
  | 'Movilidad'
  | 'Pliometría'
  | 'Brazos'
  | 'Hombro'
  | 'Glúteo'

export type MeasureType = 'reps' | 'time' | 'distance' | 'calories'

export interface LibraryExercise {
  id: string
  name: string
  aliases?: string[]
  category: ExerciseCategory
  equipment: string[]
  defaultMeasure: MeasureType
  perSide?: boolean
}

/** A coach-created library exercise (stored in AppData.customExercises). */
export interface CustomExercise extends LibraryExercise {
  custom: true
  createdAt: ISODateTime
}

/** Built-in or custom; `custom` is true only for user-created ones. */
export type AnyLibraryExercise = LibraryExercise & { custom?: boolean }

// ── Branding ────────────────────────────────────────────────────────────────

export type DisplayTheme = 'dark' | 'light'

export interface Branding {
  gymName: string
  tagline: string
  /** URL or data URL. Logo for DARK backgrounds (sidebar, TV). */
  logoUrl: string
  /** Square icon/avatar (URL or data URL). */
  iconUrl: string
  /** Main brand colour, used on dark backgrounds (default #f79cce). */
  primaryColor: string
  /** Darker brand colour readable on white, for text/buttons (default #b8287a). */
  accentColor: string
  /** TV / display theme. */
  displayTheme: DisplayTheme
}

// ── Root ────────────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = 1

export interface AppData {
  schemaVersion: number
  coaches: Coach[]
  clients: Client[]
  programs: Program[]
  notes: ClientNote[]
  customExercises: CustomExercise[]
  branding: Branding
}

// ── Input helpers ───────────────────────────────────────────────────────────

export type NewCoachInput = Pick<Coach, 'name' | 'color'>

export type NewClientInput = Pick<Client, 'firstName'> &
  Partial<Pick<Client, 'lastName' | 'plan' | 'trainingDays' | 'startDate' | 'goal' | 'color'>>

export type ClientPatch = Partial<Omit<Client, 'id' | 'createdAt'>>
export type CoachPatch = Partial<Omit<Coach, 'id'>>
export type ProgramPatch = Partial<Pick<Program, 'name'>>
export type DayPatch = Partial<Pick<Day, 'name' | 'label'>>
export type BlockPatch = Partial<Pick<Block, 'title' | 'note' | 'text'>>
export type ExercisePatch = Partial<Omit<ExerciseEntry, 'id'>>
export type NotePatch = Partial<Pick<ClientNote, 'text' | 'pinned'>>
export type CustomExerciseInput = Pick<LibraryExercise, 'name' | 'category'> &
  Partial<Pick<LibraryExercise, 'equipment' | 'defaultMeasure' | 'perSide' | 'aliases'>>
export type CustomExercisePatch = Partial<Omit<LibraryExercise, 'id'>>

export interface ProgramDatesPatch {
  startDate?: ISODate
  weeks?: number
  endDate?: ISODate
}

export interface CreateProgramOptions {
  name?: string
  startDate?: ISODate
  weeks?: number
  /** Number of days to create; default client.trainingDays. */
  dayCount?: number
  /** Default true. */
  makeCurrent?: boolean
}

// ── Sanitised data for the display (no private fields at TYPE level) ────────

export type PublicExerciseEntry = Omit<ExerciseEntry, 'internalNote'>
export interface PublicBlock extends Omit<Block, 'exercises'> {
  exercises: PublicExerciseEntry[]
}
export interface PublicDay extends Omit<Day, 'blocks'> {
  blocks: PublicBlock[]
}
export interface PublicProgram extends Omit<Program, 'days' | 'createdBy'> {
  days: PublicDay[]
}
export type PublicClient = Pick<Client, 'id' | 'firstName' | 'color' | 'archived' | 'currentProgramId'>

export interface DisplayData {
  branding: Branding
  clients: PublicClient[]
  programs: PublicProgram[]
}
