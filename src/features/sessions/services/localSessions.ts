// Local test mode: the sessions of this browser, recorded with the same rule as the database trigger (applySessionRule).
// This window hears of its own changes at once, other windows by the storage event.

import { applySessionRule, type SessionContext, type TrainingSession } from '@shared/routine'
import { STORAGE_KEYS } from '@/config/app'
import { readStorage, writeStorage } from '@/lib/safeStorage'
import type { LocalSessionRecorder, SessionsService } from './types'

const KEY = STORAGE_KEYS.sessions

function read(): TrainingSession[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as TrainingSession[]) : []
  } catch {
    return []
  }
}

/** `context`: who each person is and which class they are in, read once per change. */
export function createLocalSessions(context: (now: number) => SessionContext): SessionsService & LocalSessionRecorder {
  const listeners = new Set<() => void>()

  return {
    load: async (from) => read().filter((session) => session.gymDate >= from),

    record(before, after) {
      const current = read()
      const next = applySessionRule(current, before, after, context(Date.now()))
      if (JSON.stringify(next) === JSON.stringify(current)) return
      writeStorage(KEY, JSON.stringify(next))
      listeners.forEach((listener) => listener())
    },

    subscribe(onChange) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === KEY) onChange()
      }
      listeners.add(onChange)
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onChange)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}
