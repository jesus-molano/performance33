// Where each user shows on the screens right now: screen, section and day, from the live screens.

export interface ClientPlacement {
  screen: number
  /** The screen's saved name ('Pantalla 1' unless renamed). */
  screenName: string
  section: number
  day: number
  /** ISO time it was sent there. */
  assignedAt: string
}

interface PlacementScreen {
  id: number
  name: string
  /** One per section, in order (1-based section = index + 1). */
  contents: ReadonlyArray<{ clientId: string | null; day: number; assignedAt: string }>
}

export type ClientPlacements = ReadonlyMap<string, readonly ClientPlacement[]>

export const NO_PLACEMENTS: readonly ClientPlacement[] = []

/** Latest sent first; same time: in screen and section order. */
const byLatest = (a: ClientPlacement, b: ClientPlacement): number =>
  b.assignedAt.localeCompare(a.assignedAt) || a.screen - b.screen || a.section - b.section

/**
 * Sections by user. Sending moves a person, so there is normally one; several (two coaches at once, older data) are
 * all kept, the one sent last first. `include` leaves out the rest (archived people show as nobody on the TV).
 */
export function placementsByClient(screens: readonly PlacementScreen[], include?: ReadonlySet<string>): ClientPlacements {
  const map = new Map<string, ClientPlacement[]>()
  for (const screen of screens) {
    screen.contents.forEach((content, index) => {
      const { clientId } = content
      if (!clientId || (include && !include.has(clientId))) return
      const placement = { screen: screen.id, screenName: screen.name, section: index + 1, day: content.day, assignedAt: content.assignedAt }
      map.set(clientId, [...(map.get(clientId) ?? []), placement])
    })
  }
  for (const list of map.values()) list.sort(byLatest)
  return map
}

export const placementsOf = (placements: ClientPlacements, clientId: string): readonly ClientPlacement[] =>
  placements.get(clientId) ?? NO_PLACEMENTS

/** 'Pantalla 1 · Sección 2 · Día 3'. */
export const placementLabel = (p: ClientPlacement): string => `${p.screenName} · Sección ${p.section} · Día ${p.day}`

/** Just the screen ('Pantalla 1', or its new name) for narrow places: section and day are in the title and on their page. */
export const placementShort = (p: ClientPlacement): string => p.screenName

/** Section and day in short ('S2 · Día 3'): kept whole on phones while a long screen name is cut. */
export const placementSpot = (p: ClientPlacement): string => `S${p.section} · Día ${p.day}`

/** Every place, for a title or an aria-label: 'Pantalla 1 · Sección 2 · Día 3 y Pantalla 2 · Sección 1 · Día 1'. */
export const placementsLabel = (list: readonly ClientPlacement[]): string => list.map(placementLabel).join(' y ')

/** '+1' when the person shows in more than one section. */
export const morePlacements = (list: readonly ClientPlacement[]): string | null => (list.length > 1 ? `+${list.length - 1}` : null)
