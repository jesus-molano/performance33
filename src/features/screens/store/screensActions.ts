// Every change to screens and sections: shown here at once, then written in order (a section needs its screen
// first). A failed write reloads what the server has.

import { screensService } from '@/features/screens/services/instance'
import type { ScreenConfig, SectionChange, SectionRef, SectionTarget, SectionWrite } from '@/features/screens/types'
import { screenKey, sectionKey } from '@/features/screens/utils/pendingWrites'
import {
  applyWrites,
  clampSectionCount,
  defaultScreen,
  isScreenEmpty,
  normalizeScreen,
  planAssign,
  planClear,
  planFill,
  planReorder,
  planSend,
  planSwap,
  previousOf,
  sectionId,
  sectionIdsBeyond,
  toSection,
  upsertScreen,
  withoutSections,
} from '@/features/screens/utils/sections'
import { screenConfigOf } from '@/features/screens/utils/views'
import { reloadScreens } from './screensConnection'
import { pendingWrites, useScreensStore } from './screensStore'

const get = () => useScreensStore.getState()
const nowIso = () => new Date().toISOString()

let queue: Promise<unknown> = Promise.resolve()

/** Runs the writes one after another; false (and a reload) when one fails. */
function persist(keys: string[], task: () => Promise<unknown>): Promise<boolean> {
  const run = queue.then(task)
  queue = run.catch(() => undefined)
  return run.then(
    () => true,
    () => {
      keys.forEach(pendingWrites.forget)
      reloadScreens()
      return false
    },
  )
}

/**
 * Screens a write needs that this window does not know: created with the defaults, never over an existing one.
 * Not marked as pending: if the gym already had them, what the server says is right.
 */
function addMissingScreens(ids: readonly number[]): Promise<boolean> {
  const missing = [...new Set(ids)].filter((id) => !get().screens.some((s) => s.id === id)).map(defaultScreen)
  if (!missing.length) return Promise.resolve(true)
  useScreensStore.setState((state) => ({ screens: missing.reduce(upsertScreen, state.screens) }))
  return persist([], () => screensService.saveScreens(missing, true))
}

function writeSections(writes: SectionWrite[]): SectionChange {
  const { sections } = get()
  const previous = previousOf(sections, writes)
  if (!writes.length) return { previous, saved: Promise.resolve(true) }
  const rows = writes.map(toSection)
  const keys = rows.map((row) => sectionKey(sectionId(row)))
  useScreensStore.setState({ sections: applyWrites(sections, writes) })
  rows.forEach((row, i) => pendingWrites.mark(keys[i], row))
  void addMissingScreens(rows.map((row) => row.screen))
  return { previous, saved: persist(keys, () => screensService.saveSections(rows)) }
}

const sectionCount = (screen: number) => screenConfigOf(get().screens, screen).sections

function saveScreen(config: ScreenConfig): Promise<boolean> {
  const screen = normalizeScreen(config)
  const { screens, sections } = get()
  const beyond = sectionIdsBeyond(sections, screen.id, screen.sections)
  useScreensStore.setState({ screens: upsertScreen(screens, screen), sections: withoutSections(sections, beyond) })
  pendingWrites.mark(screenKey(screen.id), screen)
  beyond.forEach((id) => pendingWrites.mark(sectionKey(id), null))
  return persist([screenKey(screen.id), ...beyond.map(sectionKey)], async () => {
    await screensService.saveScreens([screen])
    if (beyond.length) await screensService.removeSections(beyond)
  })
}

function removeScreen(id: number): Promise<boolean> {
  const { screens, sections } = get()
  const gone = Object.values(sections)
    .filter((s) => s.screen === id)
    .map(sectionId)
  useScreensStore.setState({ screens: screens.filter((s) => s.id !== id), sections: withoutSections(sections, gone) })
  pendingWrites.mark(screenKey(id), null)
  gone.forEach((sid) => pendingWrites.mark(sectionKey(sid), null))
  return persist([screenKey(id), ...gone.map(sectionKey)], () => screensService.removeScreen(id))
}

/** Fills a screen from an old ?slots= link: only once the screens have been read, and only if it shows nobody. */
function fillScreen(screen: number, targets: readonly SectionTarget[]): SectionChange | null {
  const { status, screens, sections } = get()
  if (status !== 'ready' || !targets.length || !isScreenEmpty(sections, screen)) return null
  void saveScreen({ ...screenConfigOf(screens, screen), sections: clampSectionCount(targets.length) })
  return writeSections(planFill(get().sections, screen, targets, nowIso()))
}

export const screensActions = {
  /** Shows a client and day in one section (whoever it showed goes away). */
  assign: (ref: SectionRef, target: SectionTarget) => writeSections(planAssign(get().sections, ref, target, nowIso())),
  /** Like assign, and takes that client out of any other section: a person is on one screen at a time. */
  send: (ref: SectionRef, target: SectionTarget) => writeSections(planSend(get().sections, ref, target, nowIso())),
  clear: (ref: SectionRef) => writeSections(planClear(get().sections, ref, nowIso())),
  swap: (a: SectionRef, b: SectionRef) => writeSections(planSwap(get().sections, a, b)),
  /** Moves what section `from` shows to position `to` of the same screen (1-based); the ones in between shift. */
  reorder: (screen: number, from: number, to: number) =>
    writeSections(planReorder(get().sections, screen, sectionCount(screen), from, to)),
  /** Puts back what a change replaced (its `previous`). */
  restore: (previous: SectionWrite[]) => writeSections(previous),
  fillScreen,
  /** Name and number of sections; the sections past the new count are emptied. */
  saveScreen,
  removeScreen,
  /** Creates the screen with the defaults if the gym does not have it. */
  ensureScreen: (id: number) => addMissingScreens([id]),
}

export type ScreensActions = typeof screensActions
