// Writes of this window not confirmed yet. Until the server sends back what was written (or the time runs out), other
// copies of those rows are older and are ignored: an earlier echo must not flip a section back.

import { deepEqual } from '@/lib/deepEqual'

export interface PendingWrites {
  mark: (key: string, value: unknown) => void
  /** True when an incoming copy may be applied; the copy that matches the write ends the wait. */
  accept: (key: string, value: unknown) => boolean
  /** Stops waiting for a write that failed, unless a later write of that row (another value) is waiting too. */
  forget: (key: string, value: unknown) => void
  clear: () => void
}

export function createPendingWrites(windowMs: number, now: () => number = Date.now): PendingWrites {
  const pending = new Map<string, { value: unknown; until: number }>()
  return {
    mark: (key, value) => pending.set(key, { value, until: now() + windowMs }),
    accept: (key, value) => {
      const entry = pending.get(key)
      if (!entry) return true
      if (now() <= entry.until && !deepEqual(entry.value, value)) return false
      pending.delete(key)
      return true
    },
    forget: (key, value) => {
      const entry = pending.get(key)
      if (entry && deepEqual(entry.value, value)) pending.delete(key)
    },
    clear: () => pending.clear(),
  }
}

export const screenKey = (id: number): string => `screen:${id}`
export const sectionKey = (id: string): string => `section:${id}`
