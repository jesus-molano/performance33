// Numbers and words of "Le toca".

export const SESSIONS_CHANNEL = 'p33-sessions'

/** How often the gym day is checked (the next day changes at midnight, gym time). */
export const GYM_DAY_TICK_MS = 60_000

/** Live changes arriving this close together reload once. */
export const SESSIONS_RELOAD_DEBOUNCE_MS = 300

export const NEXT_DAY_COPY = {
  /** 'Le toca: Día 3 · Pierna'. */
  label: 'Le toca',
  hint: 'Según el último día que salió en pantalla',
} as const
