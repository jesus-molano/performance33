// Display/TV tuning constants. Sizes are in "units": the root font-size (px) of a routine view.

/**
 * Auto-fit tuning. Each routine view picks a density from its shape: taller-than-wide slots (2-4 TV
 * columns, the editor preview) use the compact layout, full screen the comfortable one.
 * Reference: 27 inch 1080p TV read from 3-4 m. Compact exercise names are 1.5 units, comfortable ones 1.9.
 */
export const AUTO_FIT = {
  /** Largest unit as a fraction of the container width (480 px column → ~19 px, 640 px → ~26 px). */
  maxUnitPerWidth: 0.04,
  /** Largest unit as a fraction of the container height (1080 px → ~28 px). */
  maxUnitPerHeight: 0.026,
  /**
   * Size a day should keep at 1080 px, same exercise name in both: compact 18,9 px and comfortable 14,8 px → names 28 px.
   * Secondary content hides before going below it; on a landscape screen, one column below it splits in two parts.
   */
  targetUnitPerHeight: { compact: 0.0175, comfortable: 0.0137 },
  /** Same target in narrow slots: 480 px column → 17,3 px → names 26 px. */
  targetUnitPerWidth: 0.036,
  /** Below this the text no longer reads well from 3-4 m: compact 16 px → names 24 px; comfortable 13,5 px → names 26 px. */
  readableUnitPerHeight: { compact: 0.0148, comfortable: 0.0125 },
  /** Keeps a day at the limits fitting (4 columns) rather than cut off. Past it, the '…' indicator. */
  lastResortUnitPerHeight: { compact: 0.0125, comfortable: 0.0115 },
  /** Slots narrower than this width/height ratio use the compact layout (640 × 1080 = 0,59; 960 × 1080 = 0,89). */
  compactMaxAspect: 1,
  /** Each part of a split screen must be at least this many units wide (one exercise line: name + prescription). */
  minColumnWidthUnits: 30,
  /** Binary search iterations. */
  iterations: 9,
} as const

/**
 * What stays on screen, from everything to the main text only. Each level is tried at the target size in turn:
 * cues first, then the decorations (block icons, the week pill), then tempo/rest lines, then block notes.
 */
export const DETAIL_LEVELS = [
  { cues: true, extras: true, details: true, notes: true },
  { cues: false, extras: true, details: true, notes: true },
  { cues: false, extras: false, details: true, notes: true },
  { cues: false, extras: false, details: false, notes: true },
  { cues: false, extras: false, details: false, notes: false },
] as const

/** Manual A-/A+ multiplier of the auto-fit maximum (A+ never pushes content off screen). */
export const FONT_SCALE = { min: 0.7, max: 1.6, step: 0.1, initial: 1 } as const

/** Overlay controls hide after this idle time. */
export const CONTROLS_IDLE_MS = 3000
/** The 'Pantalla completa' bar of a TV window that just opened goes by itself after this (or when the window loses focus). */
export const FULLSCREEN_PROMPT_MS = 15_000
/** 'Arrastra esta ventana a la tele' hint lifetime. */
export const WINDOW_HINT_MS = 7000
/** After A+, how long the columns get to report their new size, and how long the note stays. */
export const TV_SIZE_LIMIT_CHECK_MS = 400
export const TV_SIZE_LIMIT_NOTE_MS = 4000
/** 'Actualizado' highlight duration on a changed block. */
export const FLASH_MS = 1800

/** Editor preview frame ratio = a third of a 16:9 TV (640 × 1080). */
export const PREVIEW_ASPECT_CLASS = 'aspect-[16/27]'

/** Per-viewer conveniences (localStorage, may be unavailable). */
export const DISPLAY_STORAGE_KEYS = {
  /** Columns of Pantalla 1 (the key older versions used); other screens add ':N'. */
  tvSlots: 'p33:tv:slots',
  fontScale: 'p33:display:fontScale',
  /** Old ?slots= links already used on this device (see utils/legacyLinks.ts). */
  legacyLinks: 'p33:tv:legacy-links:v1',
  /** sessionStorage, + screen number: this TV window already offered fullscreen. */
  fullscreenPrompt: 'p33:tv:fullscreen-prompt:',
} as const

/** Keyboard shortcuts on display windows. */
export const DISPLAY_KEYS = {
  prevDay: ['ArrowLeft', 'PageUp'],
  nextDay: ['ArrowRight', 'PageDown'],
  fullscreen: ['f', 'F'],
  bigger: ['+', '='],
  smaller: ['-', '_'],
} as const

export type DisplayKeyAction = keyof typeof DISPLAY_KEYS

/** What the foot of a routine says when the day does not fit even at the smallest size. */
export const OVERFLOW_TEXTS = {
  rows: (count: number) => (count === 1 ? '+1 ejercicio más abajo, no cabe' : `+${count} ejercicios más abajo, no caben`),
  some: 'No cabe entera: pon menos secciones',
} as const
