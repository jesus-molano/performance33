// "Rellenar con la clase" and "Vaciar pantallas": the writes each one needs. Pure: no React, no storage.

import type { ScreenConfig, SectionMap, SectionRef, SectionWrite } from '@/features/screens/types'
import { contentOf, planClear } from './sections'

/** Someone of the class: their first name and the day of their routine they do next (null: no routine). */
export interface FillPerson {
  clientId: string
  name: string
  day: number | null
}

export interface FillPlan {
  writes: SectionWrite[]
  /** In a free section now, with their next day. */
  placed: FillPerson[]
  /** No free section left for them. */
  notFitted: FillPerson[]
  /** Nothing to show: no routine (or one without days). */
  noRoutine: FillPerson[]
  /** Already on a screen: left where they are. */
  alreadyShown: FillPerson[]
}

/** Every section of the gym's screens, in order: Pantalla 1 first, left to right. */
function allSections(screens: readonly ScreenConfig[]): SectionRef[] {
  return [...screens]
    .sort((a, b) => a.id - b.id)
    .flatMap((screen) => Array.from({ length: screen.sections }, (_, i) => ({ screen: screen.id, section: i + 1 })))
}

/**
 * Puts the people of a class in the free sections, in their order, each on their next day. A section is free when it
 * shows nobody or someone in `hidden` (archived: the TV shows nobody there). Nobody already shown is moved and no
 * section showing someone is ever overwritten. Each person once.
 */
export function planFillFromClass(
  sections: SectionMap,
  screens: readonly ScreenConfig[],
  people: readonly FillPerson[],
  hidden: ReadonlySet<string>,
  now: string,
): FillPlan {
  const refs = allSections(screens)
  const shownNow = (clientId: string | null): clientId is string => clientId !== null && !hidden.has(clientId)
  const shown = new Set(refs.map((ref) => contentOf(sections, ref).clientId).filter(shownNow))
  const free = refs.filter((ref) => !shownNow(contentOf(sections, ref).clientId))
  const plan: FillPlan = { writes: [], placed: [], notFitted: [], noRoutine: [], alreadyShown: [] }
  const seen = new Set<string>()

  for (const person of people) {
    if (seen.has(person.clientId)) continue
    seen.add(person.clientId)
    if (shown.has(person.clientId)) plan.alreadyShown.push(person)
    else if (person.day === null) plan.noRoutine.push(person)
    else {
      const ref = free.shift()
      if (!ref) plan.notFitted.push(person)
      else {
        plan.writes.push({ ref, content: { clientId: person.clientId, day: person.day, assignedAt: now } })
        plan.placed.push(person)
      }
    }
  }
  return plan
}

/** Empties every section of every screen that shows someone. */
export function planClearAll(sections: SectionMap, screens: readonly ScreenConfig[], now: string): SectionWrite[] {
  return allSections(screens).flatMap((ref) => planClear(sections, ref, now))
}

