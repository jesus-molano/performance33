// Display/TV tuning constants. Sizes are in "units": the root font-size (px) of a routine view.

/**
 * Auto-fit tuning. Each routine view picks a density from its shape: narrow slots (3-4 TV columns,
 * the editor preview) use the compact layout, wider ones (1-2 columns, full screen) the comfortable one.
 */
export const AUTO_FIT = {
  /** Largest unit as a fraction of the container width (480 px column → ~17 px, 640 px → ~22 px). */
  maxUnitPerWidth: 0.035,
  /** Largest unit as a fraction of the container height (1080 px → ~24 px). */
  maxUnitPerHeight: 0.022,
  /**
   * Readable floor (fraction of the height) auto-fit never goes below. Content that still does not fit
   * flows into two sub-columns (wide slots only) or overflows with the '…' indicator. On a 1080 px TV:
   * compact 14 px → exercise names 20 px; comfortable 11,3 px → names 23 px (legible from 3-4 m).
   */
  readableUnitPerHeight: { compact: 0.013, comfortable: 0.0105 },
  /** Slots narrower than this width/height ratio use the compact layout (640 × 1080 = 0,59; 960 × 1080 = 0,89). */
  compactMaxAspect: 0.75,
  /** A sub-column must be at least this many units wide (one exercise line: name + prescription). */
  minColumnWidthUnits: 30,
  /** In a landscape 'full' layout, 2 columns win only if they make text at least this much bigger. */
  twoColumnGain: 1.15,
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
