// Which screen windows "Rellenar" / "Mandar a pantallas" opens by itself on the gym's TV laptop.

import type { SectionWrite } from '@/features/screens/types'

/**
 * The screens that just got people and have no window open in this browser, in order, only when they have a TV on
 * this computer (`hasTv`): another computer (a coach's laptop, a phone) never opens TV windows by itself.
 */
export function screensToOpen(written: readonly SectionWrite[], openHere: ReadonlySet<number>, hasTv: (screen: number) => boolean): number[] {
  const screens = new Set<number>()
  for (const write of written) {
    if (write.content.clientId !== null) screens.add(write.ref.screen)
  }
  return [...screens].filter((screen) => !openHere.has(screen) && hasTv(screen)).sort((a, b) => a - b)
}
