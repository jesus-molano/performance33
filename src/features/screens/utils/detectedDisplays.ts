// Pure rules of 'Pantallas detectadas en este portátil' (Ajustes → Pantallas): the choice of TV for each screen.

import type { SelectOption } from '@/components/ui'
import { SCREEN_DETECTION_COPY } from '@/config/screenDetection'
import type { DetectedDisplay } from '@/lib/screenDetails'
import { assignTvDisplay, resolveTvDisplays, type TvDisplayMap } from '@/lib/tvDisplays'

/** Select value of 'let the app choose'. */
export const AUTOMATIC_DISPLAY = 'auto'

export interface DisplayChoiceRow {
  screen: number
  name: string
  value: string
  options: SelectOption[]
  /** The screen chosen for it is not connected now. */
  disconnected: boolean
}

const displayLabel = (display: DetectedDisplay): string =>
  display.isPrimary ? `${display.label} (${SCREEN_DETECTION_COPY.mainScreen})` : display.label

/** One row per gym screen: the TV it opens on, chosen by hand or automatic (showing which one that is now, `remembered` included). */
export function displayChoiceRows(
  screens: ReadonlyArray<{ id: number; name: string }>,
  choices: TvDisplayMap,
  displays: readonly DetectedDisplay[],
  remembered: TvDisplayMap = {},
): DisplayChoiceRow[] {
  const ids = screens.map((screen) => screen.id)
  const choosable = displays.map((display) => ({ value: display.key, label: displayLabel(display) }))
  return screens.map(({ id, name }) => {
    const chosen = choices[id]
    const automatic = resolveTvDisplays(assignTvDisplay(choices, id, null), displays, remembered, ids).get(id) ?? null
    const missing = chosen !== undefined && !displays.some((display) => display.key === chosen)
    const options = [
      { value: AUTOMATIC_DISPLAY, label: SCREEN_DETECTION_COPY.automatic(automatic?.label ?? null) },
      ...choosable,
      ...(missing ? [{ value: chosen, label: SCREEN_DETECTION_COPY.disconnected(chosen) }] : []),
    ]
    return { screen: id, name, value: chosen ?? AUTOMATIC_DISPLAY, options, disconnected: missing }
  })
}

/** Select value → what is saved (null: automatic). */
export const choiceFromValue = (value: string): string | null => (value === AUTOMATIC_DISPLAY ? null : value)
