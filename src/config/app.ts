// App-wide constants (timings, limits, storage keys). No magic numbers elsewhere.

export const STORAGE_KEYS = {
  data: 'p33:data:v1',
  /** Sanitised copy for Pantalla / TV windows (no private fields). */
  display: 'p33:display:v1',
  currentCoach: 'p33:currentCoach',
} as const

export const SYNC_CHANNELS = {
  data: 'p33-data',
  display: 'p33-display',
} as const

/** Debounce before writing to the repository after a change. */
export const SAVE_DEBOUNCE_MS = 400
/** Consecutive edits of the same field within this window form ONE undo step. */
export const UNDO_GROUP_MS = 1000
export const UNDO_LIMIT = 100

export const TOAST_DURATION_MS = 6000
/** Programs ending within this many days are flagged 'Caduca en N días'. */
export const EXPIRING_THRESHOLD_DAYS = 5
export const DEFAULT_PROGRAM_WEEKS = 4
export const MAX_PROGRAM_WEEKS = 52

/** Media query used for the mobile layout (bottom sheets, one column). */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

/** Maximum popup sizes: a third of a 16:9 1080p TV, and the full 3-column TV (shrunk to fit the screen). */
export const DISPLAY_WINDOW_SIZE = { width: 640, height: 1080 } as const
export const TV_WINDOW_SIZE = { width: 1600, height: 900 } as const
/** Space left around a popup so it fits within the screen (taskbar, window chrome). */
export const POPUP_SCREEN_MARGIN = 40
export const TV_SLOT_COUNT = 3
