import { describe, expect, it } from 'vitest'
import {
  findFittingUnit,
  getColumnBounds,
  getDisplayDensity,
  getUnitBounds,
  planFit,
  readableMinUnit,
  type FitResult,
} from './autoFit'

const TV_HEIGHT = 1080
/** Content whose height is `units` em tall in one column (halved, rounded up, in two). */
const contentOf = (units: number) => ({ unit, columns }: FitResult) => Math.ceil(units / columns) * unit

describe('getDisplayDensity', () => {
  it('uses the compact layout for 3 and 4 TV columns and the editor preview', () => {
    expect(getDisplayDensity(480, TV_HEIGHT)).toBe('compact')
    expect(getDisplayDensity(640, TV_HEIGHT)).toBe('compact')
    expect(getDisplayDensity(320, 540)).toBe('compact')
  })

  it('keeps the comfortable layout for 1-2 columns', () => {
    expect(getDisplayDensity(960, TV_HEIGHT)).toBe('comfortable')
    expect(getDisplayDensity(1920, TV_HEIGHT)).toBe('comfortable')
  })
})

describe('readable floor', () => {
  it('keeps compact exercise names (1.45em) at 20 px or more on a 1080 px TV', () => {
    expect(readableMinUnit(TV_HEIGHT, 'compact') * 1.45).toBeGreaterThanOrEqual(20)
  })

  it('scales with the container height', () => {
    expect(readableMinUnit(540, 'compact')).toBeCloseTo(readableMinUnit(TV_HEIGHT, 'compact') / 2)
  })

  it('is the minimum of the unit bounds unless A- pushes the max below it', () => {
    const bounds = getUnitBounds(480, TV_HEIGHT, 'compact')
    expect(bounds.min).toBeCloseTo(readableMinUnit(TV_HEIGHT, 'compact'))
    expect(bounds.max).toBeCloseTo(16.8)
    const shrunk = getUnitBounds(480, TV_HEIGHT, 'compact', 0.7)
    expect(shrunk.min).toBe(shrunk.max)
  })
})

describe('getColumnBounds', () => {
  const bounds = { min: 14, max: 24 }

  it('returns the bounds untouched for one column', () => {
    expect(getColumnBounds(bounds, 480, 1)).toBe(bounds)
  })

  it('refuses to split a slot too narrow for two readable sub-columns', () => {
    expect(getColumnBounds(bounds, 480, 2)).toBeNull()
    expect(getColumnBounds(bounds, 640, 2)).toBeNull()
  })

  it('caps the unit so each sub-column stays wide enough', () => {
    expect(getColumnBounds(bounds, 960, 2)).toEqual({ min: 14, max: 16 })
  })
})

describe('findFittingUnit', () => {
  const bounds = { min: 10, max: 20 }

  it('returns the max when everything fits', () => {
    expect(findFittingUnit((u) => u * 10, 1000, bounds)).toEqual({ unit: 20, fits: true })
  })

  it('reports when even the floor is too tall', () => {
    expect(findFittingUnit((u) => u * 200, 1000, bounds)).toEqual({ unit: 10, fits: false })
  })

  it('converges on the largest fitting unit', () => {
    const { unit, fits } = findFittingUnit((u) => u * 80, 1000, bounds)
    expect(fits).toBe(true)
    expect(unit).toBeLessThanOrEqual(12.5)
    expect(unit).toBeGreaterThan(12.45)
  })
})

describe('planFit', () => {
  const plan = (width: number, units: number, preferColumns = false) =>
    planFit({
      width,
      height: TV_HEIGHT,
      density: getDisplayDensity(width, TV_HEIGHT),
      fontScale: 1,
      preferColumns,
      measure: contentOf(units),
    })

  it('uses one column when the content fits above the floor', () => {
    const fit = plan(480, 70)
    expect(fit.columns).toBe(1)
    expect(fit.unit).toBeGreaterThanOrEqual(readableMinUnit(TV_HEIGHT, 'compact'))
  })

  it('stays at the floor in a narrow slot that cannot split (overflow indicator)', () => {
    expect(plan(480, 120)).toEqual({ unit: readableMinUnit(TV_HEIGHT, 'compact'), columns: 1 })
  })

  it('splits a wide slot into two sub-columns when one column does not fit at the floor', () => {
    const fit = plan(960, 160)
    expect(fit.columns).toBe(2)
    expect(fit.unit).toBeGreaterThanOrEqual(readableMinUnit(TV_HEIGHT, 'comfortable'))
  })

  it('keeps one column in a wide slot when it fits', () => {
    expect(plan(960, 60).columns).toBe(1)
  })

  it('prefers two columns on a landscape full screen only when text grows clearly', () => {
    expect(plan(1920, 90, true).columns).toBe(2)
    expect(plan(1920, 40, true).columns).toBe(1)
  })
})
