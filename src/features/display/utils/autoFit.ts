import type { CSSProperties } from 'react'
import { AUTO_FIT } from '@/features/display/config/display'

/** compact = narrow slot (one-line exercise rows, small header); comfortable = more air. */
export type DisplayDensity = keyof typeof AUTO_FIT.readableUnitPerHeight

export interface FitBounds {
  min: number
  max: number
}

export interface FitResult {
  /** Root font-size in px; every size inside the routine view is in em. */
  unit: number
  columns: number
}

export interface FitStatus {
  /** Content still taller than the container at the readable floor (the bottom is cut off). */
  overflowing: boolean
  /** Text below the readable floor (A- or a tiny container). */
  tooSmall: boolean
}

export interface UnitSearch {
  unit: number
  /** False when even bounds.min is too tall. */
  fits: boolean
}

/** Applies a fit to the content and returns its height. */
export type MeasureFit = (fit: FitResult) => number

export interface FitPlanInput {
  width: number
  height: number
  density: DisplayDensity
  /** Manual A-/A+ multiplier of the largest allowed size. */
  fontScale: number
  /** Landscape full screen: split into 2 columns when that makes text clearly bigger. */
  preferColumns: boolean
  measure: MeasureFit
}

/** CSS variable read by the block list (column-count). */
export const COLUMNS_VAR = '--display-columns'

export function getDisplayDensity(width: number, height: number): DisplayDensity {
  return width < height * AUTO_FIT.compactMaxAspect ? 'compact' : 'comfortable'
}

/** Smallest readable unit for a container of this height (scales down for the editor preview). */
export function readableMinUnit(height: number, density: DisplayDensity): number {
  return height * AUTO_FIT.readableUnitPerHeight[density]
}

/**
 * Unit range for a container: the max keeps a short routine from becoming absurdly huge and the
 * min is the readable floor. `fontScale` (A-/A+) scales the max, so A+ only enlarges text while it fits.
 */
export function getUnitBounds(width: number, height: number, density: DisplayDensity, fontScale = 1): FitBounds {
  const max = Math.min(width * AUTO_FIT.maxUnitPerWidth, height * AUTO_FIT.maxUnitPerHeight) * fontScale
  return { min: Math.min(readableMinUnit(height, density), max), max }
}

/** Bounds for `columns` sub-columns, each at least minColumnWidthUnits wide; null when the slot is too narrow. */
export function getColumnBounds(bounds: FitBounds, width: number, columns: number): FitBounds | null {
  if (columns <= 1) return bounds
  const widest = width / (columns * AUTO_FIT.minColumnWidthUnits)
  if (widest < bounds.min) return null
  return { min: bounds.min, max: Math.min(bounds.max, widest) }
}

/**
 * Binary search for the largest unit whose content height fits `target`.
 * `measure(unit)` must apply the unit and return the resulting content height.
 */
export function findFittingUnit(measure: (unit: number) => number, target: number, bounds: FitBounds): UnitSearch {
  if (measure(bounds.max) <= target) return { unit: bounds.max, fits: true }
  if (measure(bounds.min) > target) return { unit: bounds.min, fits: false }
  let low = bounds.min
  let high = bounds.max
  for (let i = 0; i < AUTO_FIT.iterations; i++) {
    const mid = (low + high) / 2
    if (measure(mid) <= target) low = mid
    else high = mid
  }
  return { unit: low, fits: true }
}

/** Two columns only pay off when they make the text clearly bigger than one column. */
export function prefersTwoColumns(oneColumnUnit: number, twoColumnUnit: number): boolean {
  return twoColumnUnit > oneColumnUnit * AUTO_FIT.twoColumnGain
}

/**
 * Picks unit and column count: one column between the readable floor and the max; if it does not fit
 * at the floor (or a landscape full screen prefers columns) and the slot is wide enough, two sub-columns.
 */
export function planFit({ width, height, density, fontScale, preferColumns, measure }: FitPlanInput): FitResult {
  const bounds = getUnitBounds(width, height, density, fontScale)
  const single = findFittingUnit((unit) => measure({ unit, columns: 1 }), height, bounds)
  const wantsSplit = !single.fits || (preferColumns && width > height)
  const splitBounds = wantsSplit ? getColumnBounds(bounds, width, 2) : null
  if (!splitBounds) return { unit: single.unit, columns: 1 }
  const double = findFittingUnit((unit) => measure({ unit, columns: 2 }), height, splitBounds)
  const useSplit = single.fits ? double.fits && prefersTwoColumns(single.unit, double.unit) : true
  return useSplit ? { unit: double.unit, columns: 2 } : { unit: single.unit, columns: 1 }
}

export function fitStyle({ unit, columns }: FitResult): CSSProperties {
  return { fontSize: `${unit}px`, [COLUMNS_VAR]: String(columns) } as CSSProperties
}

/** Imperative twin of fitStyle, used while measuring. */
export function applyFitToElement(el: HTMLElement, { unit, columns }: FitResult): void {
  el.style.fontSize = `${unit}px`
  el.style.setProperty(COLUMNS_VAR, String(columns))
}
