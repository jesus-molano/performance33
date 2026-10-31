import type { CSSProperties } from 'react'
import { AUTO_FIT } from '@/features/display/config/display'

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
  /** Content still taller than the container at the smallest unit (the bottom is cut off). */
  overflowing: boolean
  /** Text too small to read from 3-4 m on a TV of this height. */
  tooSmall: boolean
}

/** CSS variable read by the block list (column-count). */
export const COLUMNS_VAR = '--display-columns'

/**
 * Unit range for a container; the max keeps a short routine from becoming absurdly huge.
 * `fontScale` (A-/A+) scales the max, so A+ only enlarges text while it still fits.
 */
export function getUnitBounds(width: number, height: number, fontScale = 1): FitBounds {
  const auto = Math.max(AUTO_FIT.minUnit, Math.min(width * AUTO_FIT.maxUnitPerWidth, height * AUTO_FIT.maxUnitPerHeight))
  const max = auto * fontScale
  return { min: Math.min(AUTO_FIT.minUnit, max * AUTO_FIT.minUnitRatio, max), max }
}

/**
 * Binary search for the largest unit whose content height fits `target`.
 * `measure(unit)` must apply the unit and return the resulting content height.
 */
export function findFittingUnit(measure: (unit: number) => number, target: number, bounds: FitBounds): number {
  if (measure(bounds.max) <= target) return bounds.max
  let low = bounds.min
  let high = bounds.max
  for (let i = 0; i < AUTO_FIT.iterations; i++) {
    const mid = (low + high) / 2
    if (measure(mid) <= target) low = mid
    else high = mid
  }
  return low
}

/** Smallest comfortable unit for a container of this height (scales down for the editor preview). */
export function readableMinUnit(height: number): number {
  return height * AUTO_FIT.readableUnitPerHeight
}

/** Two columns only pay off when they make the text clearly bigger than one column. */
export function prefersTwoColumns(oneColumnUnit: number, twoColumnUnit: number): boolean {
  return twoColumnUnit > oneColumnUnit * AUTO_FIT.twoColumnGain
}

export function fitStyle({ unit, columns }: FitResult): CSSProperties {
  return { fontSize: `${unit}px`, [COLUMNS_VAR]: String(columns) } as CSSProperties
}

/** Imperative twin of fitStyle, used while measuring. */
export function applyFitToElement(el: HTMLElement, { unit, columns }: FitResult): void {
  el.style.fontSize = `${unit}px`
  el.style.setProperty(COLUMNS_VAR, String(columns))
}
