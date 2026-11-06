// ─────────────────────────────────────────────────────────────────────────────
// Domain types for Performance33 · Rutinas.
// Everything persisted lives under AppData. Dates are local calendar dates as
// 'YYYY-MM-DD' strings (ISODate); timestamps are full ISO strings (ISODateTime).
// PRIVATE fields (never shown on the TV/display): ClientNote (all of it),
// ExerciseEntry.internalNote, Client.goal. (Client.lastName reaches display windows only
// for the TV client picker; routine views show the first name.)
// ─────────────────────────────────────────────────────────────────────────────

import type { ProfileRole } from '@/lib/accountRules'
import type {
  Block,
  Day,
  ExerciseEntry,
  ID,
  ISODate,
  ISODateTime,
  MeasureType,
  Program,
  PublicProgram,
} from '@shared/routine/types.ts'

// Routine types (programs, days, blocks, exercise rows and their public copies) live in shared/routine/types.ts,
// shared with the members' app.
export type {
  Block,
  BlockParams,
  BlockType,
  Day,
  ExerciseEntry,
  ID,
  ISODate,
  ISODateTime,
  LoadUnit,
  MeasureType,
  Program,
  Progression,
  ProgressionTarget,
  PublicBlock,
  PublicDay,
  PublicExerciseEntry,
  PublicProgram,
} from '@shared/routine/types.ts'

// ── Team (who can sign in; lives outside AppData, never in undo or backups) ─

export type { ProfileRole }

/** What the whole team can see of each person. */
export interface TeamMember {
  id: ID
  name: string
  /** Hex colour for avatar, e.g. '#d6449a'. */
  color: string
  role: ProfileRole
  active: boolean
}

/** A full account: only its owner and the administrators can read it. */
export interface Profile extends TeamMember {
  username: string
  /** null = account without email (it enters with its username). */
  email: string | null
  /** Still on a temporary password: the app shows nothing else until it is replaced. */
  mustChangePassword: boolean
  /** False while the only password is a temporary one, also for someone who enters with Google and is not asked to change it. */
  hasOwnPassword: boolean
  /** Too old to create the final password from it: an administrator has to give a new one. */
  temporaryPasswordExpired: boolean
  googleConnected: boolean
}

export type OwnProfilePatch = Pick<TeamMember, 'name' | 'color'>

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
  /** Profile id of the author ('' or unknown when that person is gone: show 'Monitor eliminado'). */
  authorId: ID
  text: string
  /** Pinned = important notification: badge and banner on the client. */
  pinned: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

// ── Library ─────────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Hombro'
  | 'Bíceps'
  | 'Tríceps'
  | 'Antebrazo'
  | 'Cuádriceps'
  | 'Femoral'
  | 'Glúteo'
  | 'Gemelo'
  | 'Aductores'
  | 'Abductores'
  | 'Core'
  | 'Cuerpo entero'

export type ExerciseType = 'Fuerza' | 'Halterofilia' | 'Gimnásticos' | 'Cardio' | 'Pliometría' | 'Movilidad' | 'Calentamiento'


export interface LibraryExercise {
  id: string
  name: string
  aliases?: string[]
  /** The main muscle. */
  muscle: MuscleGroup
  /** Others it also works; absent when none. */
  secondaryMuscles?: MuscleGroup[]
  type: ExerciseType
  equipment: string[]
  defaultMeasure: MeasureType
  perSide?: boolean
  /** Video or explanation, http/https only. Without it the row's link icon searches the name. */
  link?: string
  /** Absent on the ones loaded from the initial library. */
  createdAt?: ISODateTime
}

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
  /** LIGHT_DISPLAY_THEME_VERSION once the theme follows the light default or a later choice (absent on older data). */
  displayThemeVersion: number
}

// ── Root ────────────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = 2

export interface AppData {
  schemaVersion: number
  clients: Client[]
  programs: Program[]
  notes: ClientNote[]
  /** The whole exercise library: every row can be edited and deleted (see data/exercises.ts for the initial one). */
  library: LibraryExercise[]
  branding: Branding
}

// ── Input helpers ───────────────────────────────────────────────────────────

export type NewClientInput = Pick<Client, 'firstName'> &
  Partial<Pick<Client, 'lastName' | 'plan' | 'trainingDays' | 'startDate' | 'goal' | 'color'>>

export type ClientPatch = Partial<Omit<Client, 'id' | 'createdAt'>>
export type ProgramPatch = Partial<Pick<Program, 'name'>>
export type DayPatch = Partial<Pick<Day, 'name' | 'label'>>
export type BlockPatch = Partial<Pick<Block, 'title' | 'note' | 'text'>>
export type ExercisePatch = Partial<Omit<ExerciseEntry, 'id'>>
export type NotePatch = Partial<Pick<ClientNote, 'text' | 'pinned'>>
export type LibraryExerciseInput = Pick<LibraryExercise, 'name' | 'muscle' | 'type'> &
  Partial<Pick<LibraryExercise, 'secondaryMuscles' | 'equipment' | 'defaultMeasure' | 'perSide' | 'aliases' | 'link'>>
export type LibraryExercisePatch = Partial<Omit<LibraryExercise, 'id'>>

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

/** lastName is only for the coach-facing TV client picker; routine views show the first name alone. */
export type PublicClient = Pick<Client, 'id' | 'firstName' | 'lastName' | 'color' | 'archived' | 'currentProgramId'>

export interface DisplayData {
  branding: Branding
  clients: PublicClient[]
  programs: PublicProgram[]
}
