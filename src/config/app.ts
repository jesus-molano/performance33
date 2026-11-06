// App-wide constants (timings, limits, storage keys). No magic numbers elsewhere.

export const STORAGE_KEYS = {
  /** Local test mode only: the whole dataset. Never used with the cloud. */
  data: 'p33:data:v2',
  /** Sanitised copy for Pantalla / TV windows (no private fields). Removed on sign-out. */
  display: 'p33:display:v1',
  /** Local test mode only: session and test accounts. */
  localSession: 'p33:local:session',
  localTeam: 'p33:local:accounts',
  /** Local test mode only: the members' app accounts given from the users' pages. */
  localMembers: 'p33:local:members',
  /** Session of the cloud login, shared by every window of this browser (popups included). */
  cloudSession: 'p33:session',
  /** Local test mode only: TV screens and what each section shows. */
  screens: 'p33:screens:v1',
  /** Last screens and sections read from the cloud (no private data): a TV reopened without connection has something to show. */
  screensCache: 'p33:screens:cache:v1',
  /** Local test mode only: timetable, classes, bookings and booking rules. */
  classes: 'p33:classes:v1',
  /** Local test mode only: which day of their routine each person did each day (the cloud's training_sessions). */
  sessions: 'p33:sessions:v1',
  /** This computer only: which detected TV each Pantalla opens on. */
  tvDisplays: 'p33:tv:displays',
  /** This computer only: the screen each automatic Pantalla got, shared by its windows (one opened again keeps it). */
  tvDisplaysAuto: 'p33:tv:displays:auto',
} as const

/** Left by older versions (dataset with coach profiles, picked profile, team without passwords). Removed on start-up. */
export const LEGACY_STORAGE_KEYS = ['p33:data:v1', 'p33:currentCoach', 'p33:local:team'] as const

export const SYNC_CHANNELS = {
  data: 'p33-data',
  display: 'p33-display',
  tvScreens: 'p33-tv-screens',
  /** Orders to every TV window of this browser: come to the laptop, close, go back to its TV. */
  tvControl: 'p33-tv-control',
} as const

/** Debounce before writing to the repository after a change. */
export const SAVE_DEBOUNCE_MS = 400
/** Waits between retries of a failed save; the last one repeats until it works. */
export const SAVE_RETRY_DELAYS_MS = [2000, 5000, 15000, 30000] as const
/** Remote row changes arriving this close together are applied as one update. */
export const REMOTE_BATCH_MS = 100
/** Safety net: reload shared data this often, in case a live update was missed. */
export const CLOUD_REFETCH_INTERVAL_MS = 120_000
/** A reload overlapped with a live change, so its result was dropped: try again after this long. */
export const CLOUD_REFETCH_RETRY_MS = 2000
/** Biggest request sent so that it survives the page closing (browsers cap these at 64 KB, in bytes). */
export const KEEPALIVE_MAX_BODY_CHARS = 30_000
/** Coming back to the tab or the network reloads shared data, at most this often. */
export const CLOUD_REFETCH_MIN_GAP_MS = 10_000
/** Coming back to the tab re-checks that this person still has access, at most this often. */
export const ACCESS_RECHECK_MIN_GAP_MS = 60_000
/** Rows per request when reading a table. */
export const CLOUD_PAGE_SIZE = 1000
/** Rows per request when writing or deleting (a whole library, a restored backup). */
export const CLOUD_WRITE_BATCH_SIZE = 200
/** After an edit arrives from a dashboard of this browser, a TV ignores the server's copy for this long. Longer than a save. */
export const DISPLAY_LOCAL_PRIORITY_MS = 5000
/** Years a typed date may have. */
export const DATE_INPUT_YEARS = { min: 1900, max: 2100 } as const
/** Digits of dd, mm and aaaa. */
export const DATE_PART_LENGTHS = [2, 2, 4] as const
export const DAYS_PER_WEEK = 7
/** Saved data from before this version also gets the exercises added to the initial library with it. */
export const LIBRARY_ADDITIONS_VERSION = 2
/** Consecutive edits of the same field within this window form ONE undo step. */
export const UNDO_GROUP_MS = 1000
export const UNDO_LIMIT = 100

export const TOAST_DURATION_MS = 6000
/** A toast that undoes something outside the routine history (a send to a screen) stays longer: Ctrl+Z also uses it. */
export const UNDO_ACTION_TOAST_MS = 12_000
/** How long a 'Copiada' button stays that way. */
export const COPIED_FLAG_MS = 2000
/** Programs ending within this many days are flagged 'Termina en N días'. */
export const EXPIRING_THRESHOLD_DAYS = 5
export const DEFAULT_PROGRAM_WEEKS = 4
export const MAX_PROGRAM_WEEKS = 52

/** Media query used for the mobile layout (bottom sheets, one column). */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

/**
 * Phones, also held sideways: the screen routes become normal scrolling pages and 'Pantallas' is the remote control.
 * A short window counts only with a touch screen, so a laptop with a low viewport (zoom, scaling, devtools) stays a
 * laptop. A TV popup is never one (see isScreenPopup).
 */
export const PHONE_SCREEN_QUERY = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)'

/** Maximum size of a TV window opened without a detected TV (shrunk to fit the screen). */
export const TV_WINDOW_SIZE = { width: 1600, height: 900 } as const
/** Space left around a popup so it fits within the screen (taskbar, window chrome). */
export const POPUP_SCREEN_MARGIN = 40
/** Sections of a TV screen, one person each: a new screen gets the default; coaches choose MIN..MAX. */
export const TV_DEFAULT_SECTIONS = 3
export const TV_MIN_SECTIONS = 1
export const TV_MAX_SECTIONS = 6
/** More sections than this on a 27″ TV read from 3-4 m means smaller text. */
export const TV_READABLE_SECTIONS = 3
/** From this many sections a screen uses two rows (5-6 → 3 × 2); fewer go side by side, since a routine is a tall list. */
export const TV_TWO_ROWS_FROM = 5
/** Screens created the first time the gym has none (Pantalla 1, Pantalla 2). */
export const TV_DEFAULT_SCREEN_COUNT = 2
export const TV_SCREEN_NAME_MAX_LENGTH = 30
/** A section written here ignores other copies of it for this long, unless one is what was written (older echoes). */
export const SCREENS_ECHO_WINDOW_MS = 5000
/** Holding the 'Pantalla' button this long (touch) sends to the last section used, like Ctrl+clic. */
export const SCREEN_SEND_LONG_PRESS_MS = 500
/** A finger that moves further than this is scrolling, not holding. */
export const SCREEN_SEND_LONG_PRESS_TOLERANCE_PX = 10
/** Named TV windows (Pantalla 1, Pantalla 2…), one per TV. Old URLs without a number are Pantalla 1. */
export const TV_DEFAULT_SCREEN = 1
export const TV_MAX_SCREENS = 8
/** Each screen opens this far from the previous one, so a new window does not hide the one before it. */
export const TV_WINDOW_CASCADE_PX = 40
/** After 'Cerrar todas', a TV window still open this much later could not close itself (the app did not open it). */
export const TV_CLOSE_CHECK_MS = 600
/** Wait after leaving fullscreen before moving a TV window: the browser gives it back its size first. */
export const TV_MOVE_AFTER_EXIT_MS = 250
/** Space between the TV windows brought to the laptop ('Traer todas'), so each one can be told apart. */
export const TV_TILE_GAP_PX = 8
/** window.name of the popups: it also tells a TV window from a phone, whatever its width (see isScreenPopup). */
export const SCREEN_WINDOW_NAMES = { display: 'p33-pantalla-', tv: 'p33-tv-' } as const
/** Permission that lets a window see the other screens and open windows on them (older Chrome called it 'window-placement'). */
export const WINDOW_MANAGEMENT_PERMISSIONS = ['window-management', 'window-placement'] as const
/** Old TV URLs (?slots=): token for an empty column ('-' keeps a single empty column distinct from a missing list). */
export const TV_EMPTY_SLOT_TOKEN = '-'
/** Pixels the pointer must move on a column grip before a drag starts (a click stays a click). */
export const TV_DRAG_ACTIVATION_DISTANCE = 6

/** Rows per page when browsing the exercise library. */
export const EXERCISE_PAGE_SIZE = 20
/** Google search behind the exercise link; the suffix keeps results about training. */
export const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q='
export const EXERCISE_SEARCH_SUFFIX = 'ejercicio'
