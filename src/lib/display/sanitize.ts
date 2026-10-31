// The ONLY way data reaches the TV / Pantalla / live preview. Every object is built by an
// explicit whitelist copy (never a spread of the source), so private fields such as
// notes, internalNote, lastName, goal or createdBy cannot leak even if new ones are added.

import type {
  AppData,
  Block,
  Client,
  Day,
  DisplayData,
  ExerciseEntry,
  Program,
  PublicBlock,
  PublicClient,
  PublicDay,
  PublicExerciseEntry,
  PublicProgram,
} from '@/types'

function toPublicExercise(e: ExerciseEntry): PublicExerciseEntry {
  return {
    id: e.id,
    libraryId: e.libraryId,
    name: e.name,
    measure: e.measure,
    sets: e.sets,
    reps: e.reps,
    durationSec: e.durationSec,
    distanceM: e.distanceM,
    calories: e.calories,
    load: e.load,
    loadUnit: e.loadUnit,
    rmKg: e.rmKg,
    tempo: e.tempo,
    restSec: e.restSec,
    perSide: e.perSide,
    cue: e.cue,
    progression: e.progression ? { target: e.progression.target, values: [...e.progression.values] } : null,
  }
}

function toPublicBlock(b: Block): PublicBlock {
  return {
    id: b.id,
    type: b.type,
    title: b.title,
    params: { ...b.params },
    note: b.note,
    text: b.text,
    // Rows left without a name (half-typed in the editor) mean nothing to the client.
    exercises: b.exercises.filter((e) => e.name.trim() !== '').map(toPublicExercise),
  }
}

function toPublicDay(d: Day): PublicDay {
  return { id: d.id, name: d.name, label: d.label, blocks: d.blocks.map(toPublicBlock) }
}

export function toPublicProgram(p: Program): PublicProgram {
  return {
    id: p.id,
    clientId: p.clientId,
    name: p.name,
    startDate: p.startDate,
    endDate: p.endDate,
    weeks: p.weeks,
    createdAt: p.createdAt,
    days: p.days.map(toPublicDay),
  }
}

export function toPublicClient(c: Client): PublicClient {
  return {
    id: c.id,
    firstName: c.firstName,
    lastInitial: c.lastName.trim().charAt(0).toLocaleUpperCase('es'),
    color: c.color,
    archived: c.archived,
    currentProgramId: c.currentProgramId,
  }
}

/** Strip all private data (notes, internal notes, surnames, goals, coaches, library). */
export function toDisplayData(data: AppData): DisplayData {
  return {
    branding: { ...data.branding },
    clients: data.clients.map(toPublicClient),
    programs: data.programs.map(toPublicProgram),
  }
}
