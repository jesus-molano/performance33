// Local test mode: classes and bookings in this browser, with the same rules as the cloud (localRules, localSchedule).
// Other windows hear of changes by the storage event. The first run gets the demo timetable and some bookings.

import { STORAGE_KEYS } from '@/config/app'
import { newId } from '@/lib/ids'
import { readStorage, writeStorage } from '@/lib/safeStorage'
import { addBooking, clientClasses, createSlot, moveBooking, removeBooking, updateSlot } from './localRules'
import { listDay, removeTemplate, saveTemplates } from './localSchedule'
import { createDemoClasses } from './localSeed'
import { withoutDeletedClients, type LocalClassesState, type QuotaClient, type RuleContext, type RuleResult } from './localState'
import type { ClassesService } from './types'

const KEY = STORAGE_KEYS.classes

export interface LocalClassesDeps {
  /** The users of the local dataset (plans and training days give the weekly classes). */
  clients: () => readonly (QuotaClient & { archived: boolean })[]
  profileId: () => string | null
}

export function createLocalClasses(deps: LocalClassesDeps): ClassesService {
  const context = (): RuleContext => ({ now: Date.now(), clients: deps.clients(), profileId: deps.profileId(), newId: () => newId('cls') })

  const read = (): LocalClassesState => {
    const raw = readStorage(KEY)
    if (raw) {
      try {
        return withoutDeletedClients(JSON.parse(raw) as LocalClassesState, deps.clients())
      } catch {
        // A broken copy starts again from the demo.
      }
    }
    const seeded = createDemoClasses(deps.clients().filter((c) => !c.archived).map((c) => c.id), context())
    write(seeded)
    return seeded
  }
  const write = (state: LocalClassesState) => writeStorage(KEY, JSON.stringify(state))

  /** Runs one rule over the stored state and keeps what it changed. */
  const run = async <T>(rule: (state: LocalClassesState, ctx: RuleContext) => RuleResult<T>): Promise<T> => {
    const { state, result } = rule(read(), context())
    write(state)
    return result
  }
  const change = async (rule: (state: LocalClassesState, ctx: RuleContext) => LocalClassesState): Promise<void> => {
    write(rule(read(), context()))
  }

  return {
    loadDay: (date) => run((state, ctx) => listDay(state, date, ctx)),
    loadSchedule: async () => {
      const { templates, settings } = read()
      return { templates, settings }
    },
    loadClient: async (clientId) => clientClasses(read(), clientId, context()),
    addBooking: (slotId, clientId, force) => run((state, ctx) => addBooking(state, slotId, clientId, force, ctx)),
    removeBooking: (bookingId) => run((state, ctx) => removeBooking(state, bookingId, ctx)),
    moveBooking: (bookingId, toSlotId, force) => run((state, ctx) => moveBooking(state, bookingId, toSlotId, force, ctx)),
    updateSlot: (slotId, patch) => run((state, ctx) => updateSlot(state, slotId, patch, ctx)),
    createSlot: (input) => run((state, ctx) => createSlot(state, input, ctx)),
    saveTemplates: (templates) => change((state, ctx) => saveTemplates(state, templates, ctx)),
    removeTemplate: (id) => change((state, ctx) => removeTemplate(state, id, ctx)),
    saveSettings: (settings) => change((state) => ({ ...state, settings })),
    subscribe(onChange) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === KEY) onChange()
      }
      window.addEventListener('storage', onStorage)
      return () => window.removeEventListener('storage', onStorage)
    },
  }
}
