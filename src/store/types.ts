// Store contracts. Every persisted change goes through one of these actions.
// Ids are globally unique, so actions take only the id of the thing they change.

import type {
  AppData,
  BlockParams,
  BlockPatch,
  BlockType,
  Branding,
  ClientPatch,
  CreateProgramOptions,
  LibraryExerciseInput,
  LibraryExercisePatch,
  DayPatch,
  ExerciseEntry,
  ExercisePatch,
  ISODate,
  NewClientInput,
  NotePatch,
  ProgramDatesPatch,
  ProgramPatch,
} from '@/types'

export interface ClientActions {
  addClient: (input: NewClientInput) => string
  updateClient: (id: string, patch: ClientPatch) => void
  archiveClient: (id: string) => void
  restoreClient: (id: string) => void
  /** Permanently deletes the client with their programs and notes (UI must confirm first). */
  deleteClient: (id: string) => void
}

export interface ProgramActions {
  /** New program with `dayCount` (default client.trainingDays) empty days. Becomes current by default. */
  createProgram: (clientId: string, opts?: CreateProgramOptions) => string
  updateProgram: (id: string, patch: ProgramPatch) => void
  /** weeks → recomputes endDate; endDate → recomputes weeks; startDate alone → keeps weeks, shifts endDate. */
  setProgramDates: (id: string, patch: ProgramDatesPatch) => void
  /** 'Duplicar como nueva rutina': deep copy starting max(endDate + 1, today). Current by default. */
  duplicateProgram: (id: string, opts?: { startDate?: ISODate; makeCurrent?: boolean }) => string
  setCurrentProgram: (clientId: string, programId: string | null) => void
  /** If it was current, the most recent remaining program becomes current. */
  deleteProgram: (id: string) => void
}

export interface DayActions {
  addDay: (programId: string, init?: DayPatch) => string
  updateDay: (dayId: string, patch: DayPatch) => void
  /** After renaming: an empty or automatic name goes back to 'Día N' for its position. Not while typing. */
  settleDayNames: (dayId: string) => void
  /** Inserts a deep copy right after the original. */
  duplicateDay: (dayId: string) => string
  deleteDay: (dayId: string) => void
  moveDay: (dayId: string, toIndex: number) => void
}

export interface AddBlockOptions {
  index?: number
  /** Adds one empty exercise row. */
  withExercise?: boolean
}

export interface BlockActions {
  addBlock: (dayId: string, type: BlockType, opts?: AddBlockOptions) => string
  updateBlock: (blockId: string, patch: BlockPatch) => void
  /** Merges params; pass `undefined` for a key to clear it. */
  updateBlockParams: (blockId: string, patch: Partial<BlockParams>) => void
  /** Keeps exercises and custom title; fills missing default params of the new type. */
  changeBlockType: (blockId: string, type: BlockType) => void
  duplicateBlock: (blockId: string) => string
  deleteBlock: (blockId: string) => void
  /** Within the same day or to another day (toIndex in the target day). */
  moveBlock: (blockId: string, toDayId: string, toIndex: number) => void
  /** Warm-up goes first, other types are appended. Returns the new block id. */
  copyBlockToDay: (blockId: string, dayId: string) => string
  /**
   * Copies to every other day of the same program. Warm-up/mobility replace an existing block of the
   * same type in that day; other types are inserted at the same position. Returns the number of days.
   */
  copyBlockToAllDays: (blockId: string) => number
}

export interface AddExerciseOptions {
  index?: number
  /** Default true: copy sets, reps, restSec and loadUnit from the previous row unless given in init. */
  inherit?: boolean
}

export interface ExerciseActions {
  addExercise: (blockId: string, init?: Partial<ExerciseEntry>, opts?: AddExerciseOptions) => string
  updateExercise: (exerciseId: string, patch: ExercisePatch) => void
  /** Inserts a copy right after. */
  duplicateExercise: (exerciseId: string) => string
  deleteExercise: (exerciseId: string) => void
  /** Removes the row if it still has no name, WITHOUT an undo step. Returns true when removed. */
  discardUnnamedExercise: (exerciseId: string) => boolean
  /** Within a block or to another block (any day). */
  moveExercise: (exerciseId: string, toBlockId: string, toIndex: number) => void
}

export interface NoteActions {
  /** Author = signed-in coach. */
  addNote: (clientId: string, text: string, opts?: { pinned?: boolean }) => string
  updateNote: (id: string, patch: NotePatch) => void
  deleteNote: (id: string) => void
}

export interface SettingsActions {
  updateBranding: (patch: Partial<Branding>) => void
  resetBranding: () => void
  addLibraryExercise: (input: LibraryExerciseInput) => string
  updateLibraryExercise: (id: string, patch: LibraryExercisePatch) => void
  deleteLibraryExercise: (id: string) => void
  /** Replaces everything with a validated backup (see normalizeAppData). Clears undo history. */
  importData: (data: AppData) => void
  /** Fresh demo data relative to today, replacing everything. Clears undo history. */
  resetDemoData: () => void
  /** Adds the demo clients, routines and notes to an empty database; branding and library stay. Clears undo history. */
  loadDemoData: () => void
}

export type AppActions = ClientActions &
  ProgramActions &
  DayActions &
  BlockActions &
  ExerciseActions &
  NoteActions &
  SettingsActions

export interface AppState extends AppActions {
  data: AppData
}

/** What every slice receives from the store. */
export interface SliceContext {
  /**
   * Applies `recipe` as ONE undo step. Calls with the same `groupKey` within UNDO_GROUP_MS are
   * merged into the previous step (typing never undoes one character at a time).
   */
  commit: (recipe: (data: AppData) => AppData, groupKey?: string) => void
  getData: () => AppData
  clearHistory: () => void
  /** Applies `recipe` without recording an undo step (housekeeping). */
  commitSilently: (recipe: (data: AppData) => AppData) => void
}
