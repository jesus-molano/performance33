// Validation / migration of persisted or imported JSON into a well-formed AppData.

import { DEFAULT_BRANDING } from '../config/branding'
import { SCHEMA_VERSION, type AppData } from '../types'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function arrayOr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * Normalised AppData, or null when `raw` is not recognisable as app data.
 * Accepts the export envelope { app, exportedAt, data }. Fills missing collections and
 * branding fields with defaults. Future schema migrations go here (switch on schemaVersion).
 */
export function normalizeAppData(raw: unknown): AppData | null {
  if (!isRecord(raw)) return null
  if (isRecord(raw.data) && !Array.isArray(raw.clients)) return normalizeAppData(raw.data)
  if (!Array.isArray(raw.clients) || !Array.isArray(raw.coaches)) return null
  const branding = isRecord(raw.branding) ? (raw.branding as Partial<AppData['branding']>) : {}
  return {
    schemaVersion: SCHEMA_VERSION,
    coaches: arrayOr(raw.coaches),
    clients: arrayOr(raw.clients),
    programs: arrayOr(raw.programs),
    notes: arrayOr(raw.notes),
    customExercises: arrayOr(raw.customExercises),
    branding: { ...DEFAULT_BRANDING, ...branding },
  }
}
