// JSON backup export / import (Ajustes → Datos).

import { backupFilename, downloadJson } from '../lib/files'
import type { AppData } from '../types'
import { normalizeAppData } from './migrate'

export interface ExportEnvelope {
  app: 'performance33-rutinas'
  exportedAt: string
  data: AppData
}

export function createExportEnvelope(data: AppData): ExportEnvelope {
  return { app: 'performance33-rutinas', exportedAt: new Date().toISOString(), data }
}

/** Downloads 'performance33-copia-YYYY-MM-DD.json'. */
export function downloadBackup(data: AppData): void {
  downloadJson(createExportEnvelope(data), backupFilename())
}

/** Reads and validates a backup file. Rejects with a Spanish message. */
export async function readBackupFile(file: File): Promise<AppData> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('El archivo no es una copia de seguridad válida.')
  }
  const data = normalizeAppData(parsed)
  if (!data) throw new Error('El archivo no contiene datos de Performance33.')
  return data
}
