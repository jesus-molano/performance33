// Display/TV tuning constants. Sizes are in "units": the root font-size (px) of a routine view.

/** Unit search bounds for auto-fit, relative to the container size. */
export const AUTO_FIT = {
  /** Smallest unit for TV-sized containers (px). */
  minUnit: 7,
  /** Small containers (editor preview) may shrink down to this fraction of their max unit. */
  minUnitRatio: 0.3,
  /** Largest unit as a fraction of the container width (640 px column → ~22 px). */
  maxUnitPerWidth: 0.035,
  /** Largest unit as a fraction of the container height (1080 px → ~24 px). */
  maxUnitPerHeight: 0.022,
  /** In a landscape 'full' layout, 2 columns win only if they make text at least this much bigger. */
  twoColumnGain: 1.15,
  /** Below this unit (as a fraction of the height, 13 px on a 1080 px TV) text is hard to read from 3-4 m. */
  readableUnitPerHeight: 0.012,
  /** Binary search iterations. */
  iterations: 9,
} as const

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
