import type { CSSProperties } from 'react'
import { AUTO_FIT } from '../config/display'

export interface FitBounds {
  min: number
  max: number
}

export interface FitResult {
  /** Root font-size in px; every size inside the routine view is in em. */
  unit: number
  columns: number
}

/** CSS variable read by the block list (column-count). */
export const COLUMNS_VAR = '--display-columns'

/** Unit range for a container; the max keeps a short routine from becoming absurdly huge. */
export function getUnitBounds(width: number, height: number): FitBounds {
  const max = Math.max(AUTO_FIT.minUnit, Math.min(width * AUTO_FIT.maxUnitPerWidth, height * AUTO_FIT.maxUnitPerHeight))
  return { min: Math.min(AUTO_FIT.minUnit, max * AUTO_FIT.minUnitRatio), max }
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
