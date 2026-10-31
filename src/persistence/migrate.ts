// Validation / migration of persisted or imported JSON into a well-formed AppData.
// Every entity is rebuilt over its defaults, so an old or hand-edited backup can never leave
// a program without days, a block without exercises, etc. (which would crash the editor and TV).

import { DEFAULT_PROGRAM_WEEKS } from '@/config/app'
import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { DEFAULT_BRANDING, LEGACY_ACCENT_COLOR } from '@/config/branding'
import { UNKNOWN_AUTHOR_COLOR } from '@/config/colors'
import { PLAN_BY_ID } from '@/config/plans'
import { endDateFor, isValidISODate, todayISO } from '@/lib/dates'
import { renumberDays } from '@/lib/days'
import { createBlock, createExercise } from '@/lib/factories'
import {
  SCHEMA_VERSION,
  type AppData,
  type Block,
  type Branding,
  type Client,
  type ClientNote,
  type Coach,
  type CustomExercise,
  type Day,
  type ExerciseEntry,
  type Program,
} from '@/types'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Records with a string id, each turned into a full entity by `build`. */
function normalizeList<T>(value: unknown, build: (raw: UnknownRecord & { id: string }) => T): T[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is UnknownRecord & { id: string } => isRecord(item) && typeof item.id === 'string').map(build)
}

const text = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback)

function normalizeExercise(raw: UnknownRecord & { id: string }): ExerciseEntry {
  const defaults = createExercise()
  const entry = { ...defaults, ...(raw as Partial<ExerciseEntry>), id: raw.id }
  return { ...entry, name: text(entry.name), reps: text(entry.reps), cue: text(entry.cue), internalNote: text(entry.internalNote) }
}

function normalizeBlock(raw: UnknownRecord & { id: string }): Block {
  const type = (typeof raw.type === 'string' && raw.type in BLOCK_TYPE_META ? raw.type : 'normal') as Block['type']
  const base = createBlock(type, { params: isRecord(raw.params) ? raw.params : {} })
  return {
    ...base,
    id: raw.id,
    title: text(raw.title),
    note: text(raw.note),
    text: text(raw.text),
    exercises: normalizeList(raw.exercises, normalizeExercise),
  }
}

function normalizeDay(raw: UnknownRecord & { id: string }): Day {
  return { id: raw.id, name: text(raw.name), label: text(raw.label), blocks: normalizeList(raw.blocks, normalizeBlock) }
}

function normalizeProgram(raw: UnknownRecord & { id: string }): Program {
  const weeks = typeof raw.weeks === 'number' && raw.weeks >= 1 ? raw.weeks : DEFAULT_PROGRAM_WEEKS
  const startDate = isValidISODate(text(raw.startDate)) ? text(raw.startDate) : todayISO()
  const endDate = isValidISODate(text(raw.endDate)) ? text(raw.endDate) : endDateFor(startDate, weeks)
  return {
    ...(raw as unknown as Program),
    name: text(raw.name),
    clientId: text(raw.clientId),
    startDate,
    endDate,
    weeks,
    days: renumberDays(normalizeList(raw.days, normalizeDay)),
  }
}

function normalizeClient(raw: UnknownRecord & { id: string }): Client {
  const client = raw as Partial<Client>
  const plan = client.plan && client.plan in PLAN_BY_ID ? client.plan : 'custom'
  return {
    ...(raw as unknown as Client),
    firstName: text(client.firstName, 'Cliente'),
    lastName: text(client.lastName),
    goal: text(client.goal),
    plan,
    trainingDays: typeof client.trainingDays === 'number' ? client.trainingDays : PLAN_BY_ID[plan].defaultDays,
    color: text(client.color, UNKNOWN_AUTHOR_COLOR),
    archived: client.archived === true,
    currentProgramId: typeof client.currentProgramId === 'string' ? client.currentProgramId : null,
  }
}

function normalizeCoach(raw: UnknownRecord & { id: string }): Coach {
  return { id: raw.id, name: text(raw.name, 'Monitor'), color: text(raw.color, UNKNOWN_AUTHOR_COLOR) }
}

function normalizeNote(raw: UnknownRecord & { id: string }): ClientNote {
  return { ...(raw as unknown as ClientNote), text: text(raw.text), pinned: raw.pinned === true }
}

function normalizeBranding(raw: unknown): Branding {
  const branding = { ...DEFAULT_BRANDING, ...(isRecord(raw) ? (raw as Partial<Branding>) : {}) }
  return branding.accentColor === LEGACY_ACCENT_COLOR ? { ...branding, accentColor: DEFAULT_BRANDING.accentColor } : branding
}

/**
 * Normalised AppData, or null when `raw` is not recognisable as app data (or has no coach, which
 * would leave nobody to pick on '¿Quién eres?'). Accepts the export envelope { app, exportedAt, data }.
 * Future schema migrations go here (switch on schemaVersion).
 */
export function normalizeAppData(raw: unknown): AppData | null {
  if (!isRecord(raw)) return null
  if (isRecord(raw.data) && !Array.isArray(raw.clients)) return normalizeAppData(raw.data)
  if (!Array.isArray(raw.clients) || !Array.isArray(raw.coaches)) return null
  const coaches = normalizeList(raw.coaches, normalizeCoach)
  if (coaches.length === 0) return null
  return {
    schemaVersion: SCHEMA_VERSION,
    coaches,
    clients: normalizeList(raw.clients, normalizeClient),
    programs: normalizeList(raw.programs, normalizeProgram),
    notes: normalizeList(raw.notes, normalizeNote),
    customExercises: normalizeList(raw.customExercises, (e) => e as unknown as CustomExercise),
    branding: normalizeBranding(raw.branding),
  }
}
