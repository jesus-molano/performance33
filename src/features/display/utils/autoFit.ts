import type { CSSProperties } from 'react'
import { AUTO_FIT, DETAIL_LEVELS } from '@/features/display/config/display'

/** compact = narrow slot (one-line exercise rows, small header); comfortable = more air. */
export type DisplayDensity = keyof typeof AUTO_FIT.readableUnitPerHeight

export interface FitBounds {
  min: number
  max: number
}

export interface UnitBounds extends FitBounds {
  /** Size a day should keep: secondary content drops before text goes below this. */
  target: number
}

export interface FitResult {
  /** Root font-size in px; every size inside the routine view is in em. */
  unit: number
  columns: number
  /** Index in DETAIL_LEVELS: how much secondary content is hidden. */
  detail: number
}

export interface FitStatus {
  /** Content still taller than the container at the smallest size (the bottom is cut off). */
  overflowing: boolean
  /** Text below the readable floor (too much content, A- or a tiny container). */
  tooSmall: boolean
  /** Cues, tempo/rest lines or notes are hidden so the day fits at a readable size. */
  detailHidden: boolean
}

export interface UnitSearch {
  unit: number
  /** False when even bounds.min is too tall. */
  fits: boolean
}

interface PlannedFit extends FitResult {
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
  /** May split in two parts when one column does not fit at a good size (only one client on a landscape screen). */
  canSplit: boolean
  measure: MeasureFit
}

/** One way to lay out a day. A strict stage only counts if everything fits at the target size; else the next one is tried. */
export interface FitStage {
  density: DisplayDensity
  strict: boolean
}

/** CSS variables read by the block list (column-count), the block numbers (only when split) and the rows (secondary content). */
export const COLUMNS_VAR = '--display-columns'
const CUE_VAR = '--display-cue'
const DETAIL_VAR = '--display-detail'
const NOTE_VAR = '--display-note'
const ORDER_VAR = '--display-order'

export function getDisplayDensity(width: number, height: number): DisplayDensity {
  return width < height * AUTO_FIT.compactMaxAspect ? 'compact' : 'comfortable'
}

/** Readable floor for a container of this height (scales down for the editor preview). */
export function readableMinUnit(height: number, density: DisplayDensity): number {
  return height * AUTO_FIT.readableUnitPerHeight[density]
}

/**
 * Unit range for a container: the max keeps a short routine from becoming absurdly huge, the target is
 * what a day should keep and the min is the last resort so it still fits. `fontScale` (A-/A+) scales
 * the max, so A+ only enlarges text while it fits.
 */
export function getUnitBounds(width: number, height: number, density: DisplayDensity, fontScale = 1): UnitBounds {
  const max = Math.min(width * AUTO_FIT.maxUnitPerWidth, height * AUTO_FIT.maxUnitPerHeight) * fontScale
  const target = Math.min(width * AUTO_FIT.targetUnitPerWidth, height * AUTO_FIT.targetUnitPerHeight[density], max)
  return { min: Math.min(height * AUTO_FIT.lastResortUnitPerHeight[density], target), target, max }
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

function planOneColumn({ height, measure }: FitPlanInput, bounds: FitBounds, detail: number): PlannedFit {
  const { unit, fits } = findFittingUnit((candidate) => measure({ unit: candidate, columns: 1, detail }), height, bounds)
  return { unit, columns: 1, detail, fits }
}

/** Two parts, or null when the slot is too narrow for them or may not split. */
function planTwoParts({ width, height, canSplit, measure }: FitPlanInput, bounds: FitBounds, detail: number): PlannedFit | null {
  const partBounds = canSplit && width > height ? getColumnBounds(bounds, width, 2) : null
  if (!partBounds) return null
  const { unit, fits } = findFittingUnit((candidate) => measure({ unit: candidate, columns: 2, detail }), height, partBounds)
  return { unit, columns: 2, detail, fits }
}

const toFitResult = ({ unit, columns, detail }: PlannedFit): FitResult => ({ unit, columns, detail })

/**
 * One column whenever it fits at the target size. If it does not and the screen may split, two parts with the same
 * content win over hiding anything. Otherwise secondary content drops: cues, then tempo/rest, then notes. Only with
 * all of that gone does the text go below the target, down to the last-resort size.
 */
export function planFit(input: FitPlanInput): FitResult {
  const { width, height, density, fontScale } = input
  const { min, target, max } = getUnitBounds(width, height, density, fontScale)
  const bounds = { min: target, max }
  for (let detail = 0; detail < DETAIL_LEVELS.length; detail++) {
    const oneColumn = planOneColumn(input, bounds, detail)
    if (oneColumn.fits) return toFitResult(oneColumn)
    const twoParts = planTwoParts(input, bounds, detail)
    if (twoParts?.fits) return toFitResult(twoParts)
  }
  const lastDetail = DETAIL_LEVELS.length - 1
  const lastResort = { min, max }
  return toFitResult(planTwoParts(input, lastResort, lastDetail) ?? planOneColumn(input, lastResort, lastDetail))
}

/**
 * Order of the layouts for one client on a landscape screen: one roomy column, one tighter column and only then two
 * parts. Measuring each density needs its own render, so the hook walks these stages. Anything else has a single stage.
 */
export function getFitStages(width: number, height: number, canSplit: boolean): FitStage[] {
  const final = { density: getDisplayDensity(width, height), strict: false }
  if (!canSplit || width <= height) return [final]
  return [{ density: 'comfortable', strict: true }, { density: 'compact', strict: true }, final]
}

/** The fit of a stage, or null when a strict stage does not hold the whole day at the target size. */
export function planStage(input: FitPlanInput, stage: FitStage): FitResult | null {
  if (!stage.strict) return planFit(input)
  const { target, max } = getUnitBounds(input.width, input.height, input.density, input.fontScale)
  const oneColumn = planOneColumn(input, { min: target, max }, 0)
  return oneColumn.fits ? toFitResult(oneColumn) : null
}

function fitVars({ columns, detail }: FitResult): Record<string, string> {
  const level = DETAIL_LEVELS[detail]
  return {
    [COLUMNS_VAR]: String(columns),
    [CUE_VAR]: level.cues ? 'block' : 'none',
    [DETAIL_VAR]: level.details ? 'block' : 'none',
    [NOTE_VAR]: level.notes ? 'flex' : 'none',
    [ORDER_VAR]: columns > 1 ? 'flex' : 'none',
  }
}

export function fitStyle(fit: FitResult): CSSProperties {
  return { fontSize: `${fit.unit}px`, ...fitVars(fit) } as CSSProperties
}

/** Imperative twin of fitStyle, used while measuring. */
export function applyFitToElement(el: HTMLElement, fit: FitResult): void {
  el.style.fontSize = `${fit.unit}px`
  for (const [name, value] of Object.entries(fitVars(fit))) el.style.setProperty(name, value)
}
