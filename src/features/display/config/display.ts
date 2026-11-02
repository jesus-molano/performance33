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
  /** Size a day should keep at 1080 px: 18,9 px → compact names 28 px. Secondary content hides before going below it. */
  targetUnitPerHeight: 0.0175,
  /** Same target in narrow slots: 480 px column → 17,3 px → names 26 px. */
  targetUnitPerWidth: 0.036,
  /** Below this the text no longer reads well from 3-4 m: compact 16 px → names 24 px; comfortable 13,5 px → names 26 px. */
  readableUnitPerHeight: { compact: 0.0148, comfortable: 0.0125 },
  /** Keeps a day at the limits fitting (4 columns) rather than cut off. Past it, two sub-columns or the '…' indicator. */
  lastResortUnitPerHeight: { compact: 0.0125, comfortable: 0.0115 },
  /** Slots narrower than this width/height ratio use the compact layout (640 × 1080 = 0,59; 960 × 1080 = 0,89). */
  compactMaxAspect: 1,
  /** A sub-column must be at least this many units wide (one exercise line: name + prescription). */
  minColumnWidthUnits: 30,
  /** In a landscape 'full' layout, 2 columns win only if they make text at least this much bigger. */
  twoColumnGain: 1.15,
  /** Binary search iterations. */
  iterations: 9,
} as const

/** What stays on screen, from everything to the main text only. Each level is tried at the target size in turn. */
export const DETAIL_LEVELS = [
  { cues: true, details: true, notes: true },
  { cues: false, details: true, notes: true },
  { cues: false, details: false, notes: true },
  { cues: false, details: false, notes: false },
] as const

/** Manual A-/A+ multiplier of the auto-fit maximum (A+ never pushes content off screen). */
export const FONT_SCALE = { min: 0.7, max: 1.6, step: 0.1, initial: 1 } as const

/** Overlay controls hide after this idle time. */
export const CONTROLS_IDLE_MS = 3000
/** 'Arrastra esta ventana a la tele' hint lifetime. */
export const WINDOW_HINT_MS = 7000
/** 'Actualizado' highlight duration on a changed block. */
export const FLASH_MS = 1800

/** Editor preview frame ratio = a third of a 16:9 TV (640 × 1080). */
export const PREVIEW_ASPECT_CLASS = 'aspect-[16/27]'

/** Per-viewer conveniences (localStorage, may be unavailable). */
export const DISPLAY_STORAGE_KEYS = {
  tvSlots: 'p33:tv:slots',
  fontScale: 'p33:display:fontScale',
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
