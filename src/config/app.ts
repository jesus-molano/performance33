// App-wide constants (timings, limits, storage keys). No magic numbers elsewhere.

export const STORAGE_KEYS = {
  /** Local test mode only: the whole dataset. Never used with the cloud. */
  data: 'p33:data:v2',
  /** Sanitised copy for Pantalla / TV windows (no private fields). Removed on sign-out. */
  display: 'p33:display:v1',
  /** Local test mode only: fake session and team. */
  localSession: 'p33:local:session',
  localTeam: 'p33:local:team',
  /** Session of the cloud login, shared by every window of this browser (popups included). */
  cloudSession: 'p33:session',
} as const

/** Left by older versions (dataset with coach profiles, picked profile). Removed on start-up. */
export const LEGACY_STORAGE_KEYS = ['p33:data:v1', 'p33:currentCoach'] as const

export const SYNC_CHANNELS = {
  data: 'p33-data',
  display: 'p33-display',
} as const

/** Debounce before writing to the repository after a change. */
export const SAVE_DEBOUNCE_MS = 400
/** Waits between retries of a failed save; the last one repeats until it works. */
export const SAVE_RETRY_DELAYS_MS = [2000, 5000, 15000, 30000] as const
/** Remote row changes arriving this close together are applied as one update. */
export const REMOTE_BATCH_MS = 100
/** Safety net: reload shared data this often, in case a live update was missed. */
export const CLOUD_REFETCH_INTERVAL_MS = 120_000
/** Coming back to the tab or the network reloads shared data, at most this often. */
export const CLOUD_REFETCH_MIN_GAP_MS = 10_000
/** Coming back to the tab re-checks that this person still has access, at most this often. */
export const ACCESS_RECHECK_MIN_GAP_MS = 60_000
/** Rows per request when reading a table. */
export const CLOUD_PAGE_SIZE = 1000
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

/** Maximum popup sizes: a third of a 16:9 1080p TV, and the full multi-column TV (shrunk to fit the screen). */
export const DISPLAY_WINDOW_SIZE = { width: 640, height: 1080 } as const
export const TV_WINDOW_SIZE = { width: 1600, height: 900 } as const
/** Space left around a popup so it fits within the screen (taskbar, window chrome). */
export const POPUP_SCREEN_MARGIN = 40
/** Modo TV columns: old URLs and fresh setups get the default; coaches can choose MIN..MAX. */
export const TV_DEFAULT_SLOTS = 3
export const TV_MIN_SLOTS = 1
export const TV_MAX_SLOTS = 4
/** URL token for an empty TV column ('-' keeps a single empty column distinct from a missing list). */
export const TV_EMPTY_SLOT_TOKEN = '-'
/** Pixels the pointer must move on a column grip before a drag starts (a click stays a click). */
export const TV_DRAG_ACTIVATION_DISTANCE = 6
