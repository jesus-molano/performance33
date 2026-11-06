// Every change to screens and sections: shown here at once, then written in order (a section needs its screen
// first). A failed write reloads what the server has.

import { screensService } from '@/features/screens/services/instance'
import type { ScreenConfig, SectionChange, SectionRef, SectionTarget, SectionWrite, UndoResult } from '@/features/screens/types'
import { screenKey, sectionKey } from '@/features/screens/utils/pendingWrites'
import { sectionsResizedAway, writableWrites } from '@/features/screens/utils/sectionLimits'
import {
  applyWrites,
  clampSectionCount,
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
  toSection,
  upsertScreen,
  withoutSections,
} from '@/features/screens/utils/sections'
import { planUndo } from '@/features/screens/utils/undo'
import { screenConfigOf } from '@/features/screens/utils/views'
import { reloadScreens } from './screensConnection'
import { pendingWrites, useScreensStore } from './screensStore'

const get = () => useScreensStore.getState()
const nowIso = () => new Date().toISOString()

/** A row this window wrote and the value it waits to hear back (null: deleted). */
type PendingMark = readonly [key: string, value: unknown]

let queue: Promise<unknown> = Promise.resolve()

/** Runs the writes one after another; false (and a reload) when one fails. */
function persist(marks: readonly PendingMark[], task: () => Promise<unknown>): Promise<boolean> {
  marks.forEach(([key, value]) => pendingWrites.mark(key, value))
  const run = queue.then(task)
  queue = run.catch(() => undefined)
  return run.then(
    () => true,
    () => {
      marks.forEach(([key, value]) => pendingWrites.forget(key, value))
      reloadScreens()
      return false
    },
  )
}

function writeSections(planned: SectionWrite[]): SectionChange {
  const { screens, sections } = get()
  const written = writableWrites(screens, planned)
  const previous = previousOf(sections, written)
  if (!written.length) return { written, previous, saved: Promise.resolve(true) }
  const rows = written.map(toSection)
  useScreensStore.setState({ sections: applyWrites(sections, written) })
  const marks = rows.map((row): PendingMark => [sectionKey(sectionId(row)), row])
  return { written, previous, saved: persist(marks, () => screensService.saveSections(rows)) }
}

const sectionCount = (screen: number) => screenConfigOf(get().screens, screen).sections

/** Name and number of sections. The database empties the sections a new count leaves out or brings back. */
function saveScreen(config: ScreenConfig): Promise<boolean> {
  const screen = normalizeScreen(config)
  const { screens, sections } = get()
  const away = sectionsResizedAway(sections, screens, screen)
  useScreensStore.setState({ screens: upsertScreen(screens, screen), sections: withoutSections(sections, away) })
  const marks = [[screenKey(screen.id), screen] as const, ...away.map((id) => [sectionKey(id), null] as const)]
  return persist(marks, () => screensService.saveScreens([screen]))
}

/**
 * Creates the screens the gym does not have yet and leaves any existing one as it is (another tab or computer may
 * have created or renamed it meanwhile), then reads back what the server kept.
 */
function ensureScreens(configs: readonly ScreenConfig[]): Promise<boolean> {
  const { screens } = get()
  const fresh = configs.map(normalizeScreen).filter((config) => !screens.some((s) => s.id === config.id))
  if (!fresh.length) return Promise.resolve(true)
  useScreensStore.setState({ screens: fresh.reduce<ScreenConfig[]>(upsertScreen, [...screens]) })
  const saved = persist([], () => screensService.saveScreens(fresh, true))
  void saved.then((ok) => ok && reloadScreens())
  return saved
}

function removeScreen(id: number): Promise<boolean> {
  const { screens, sections } = get()
  const gone = Object.values(sections)
    .filter((s) => s.screen === id)
    .map(sectionId)
  useScreensStore.setState({ screens: screens.filter((s) => s.id !== id), sections: withoutSections(sections, gone) })
  const marks = [[screenKey(id), null] as const, ...gone.map((sid) => [sectionKey(sid), null] as const)]
  return persist(marks, () => screensService.removeScreen(id))
}

/** Fills a screen from an old ?slots= link: only once the screens have been read, and only if it shows nobody. */
function fillScreen(screen: number, targets: readonly SectionTarget[]): SectionChange | null {
  const { status, screens, sections } = get()
  if (status !== 'ready' || !targets.length || !isScreenEmpty(sections, screen)) return null
  void saveScreen({ ...screenConfigOf(screens, screen), sections: clampSectionCount(targets.length) })
  return writeSections(planFill(get().sections, screen, targets, nowIso()))
}

/** Puts back what a change replaced, in the sections nobody has changed since. */
function undo(change: Pick<SectionChange, 'previous' | 'written'>): UndoResult {
  const { writes, skipped } = planUndo(get().sections, change)
  return { skipped, saved: writeSections(writes).saved }
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
  /** Writes back sections exactly as they were (sections emptied by a smaller count, once the count is back). */
  restore: (previous: SectionWrite[]) => writeSections(previous),
  undo,
  fillScreen,
  /** Name and number of sections; the sections past the new count are emptied. Creates the screen if it is new. */
  saveScreen,
  /** Creates only the screens that do not exist (one per TV detected), never touching one that does. */
  ensureScreens,
  removeScreen,
}

export type ScreensActions = typeof screensActions
