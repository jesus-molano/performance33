// Factories producing fully-populated domain objects with sensible defaults.
// Used by the store and the seed. All return NEW objects with fresh ids.

import { DEFAULT_BRANDING } from '@/config/branding'
import { SCHEMA_VERSION, type AnyLibraryExercise, type AppData, type Block, type BlockType, type Day, type ExerciseEntry } from '@/types'
import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { DEFAULT_REPS, DEFAULT_SETS } from '@/config/exerciseFields'
import { defaultDayName } from './days'
import { newId } from './ids'

export function createExercise(init: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return {
    libraryId: null,
    name: '',
    measure: 'reps',
    sets: DEFAULT_SETS,
    reps: DEFAULT_REPS,
    durationSec: null,
    distanceM: null,
    calories: null,
    load: '',
    loadUnit: 'kg',
    rmKg: null,
    tempo: '',
    restSec: null,
    perSide: false,
    cue: '',
    internalNote: '',
    progression: null,
    ...init,
    id: newId('ex'),
  }
}

/** Sensible measure defaults when picking a library exercise (keeps sets/rest from `base`). */
export function exercisePatchFromLibrary(lib: AnyLibraryExercise, base?: Partial<ExerciseEntry>): Partial<ExerciseEntry> {
  const patch: Partial<ExerciseEntry> = {
    libraryId: lib.id,
    name: lib.name,
    measure: lib.defaultMeasure,
    perSide: !!lib.perSide,
  }
  if (lib.defaultMeasure === 'time' && base?.durationSec == null) patch.durationSec = 30
  if (lib.defaultMeasure === 'distance' && base?.distanceM == null) patch.distanceM = 400
  if (lib.defaultMeasure === 'calories' && base?.calories == null) patch.calories = 12
  return patch
}

/** Deep clone of an exercise with a new id. */
export function cloneExercise(e: ExerciseEntry): ExerciseEntry {
  return {
    ...e,
    progression: e.progression ? { ...e.progression, values: [...e.progression.values] } : null,
    id: newId('ex'),
  }
}

export function createBlock(type: BlockType, init: Partial<Omit<Block, 'id' | 'type'>> = {}): Block {
  return {
    title: '',
    note: '',
    text: '',
    exercises: [],
    ...init,
    params: { ...BLOCK_TYPE_META[type].defaultParams, ...(init.params ?? {}) },
    type,
    id: newId('blk'),
  }
}

/** Deep clone of a block (new ids for block and exercises). */
export function cloneBlock(b: Block): Block {
  return { ...b, params: { ...b.params }, exercises: b.exercises.map(cloneExercise), id: newId('blk') }
}

export function createDay(index: number, init: Partial<Omit<Day, 'id'>> = {}): Day {
  return { name: defaultDayName(index), label: '', blocks: [], ...init, id: newId('day') }
}

/** Deep clone of a day (new ids everywhere). */
export function cloneDay(d: Day): Day {
  return { ...d, blocks: d.blocks.map(cloneBlock), id: newId('day') }
}

/** Empty dataset (before hydration). */
export function createEmptyData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    clients: [],
    programs: [],
    notes: [],
    customExercises: [],
    branding: { ...DEFAULT_BRANDING },
  }
}
