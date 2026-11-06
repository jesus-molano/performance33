import { describe, expect, it } from 'vitest'
import { DETAIL_LEVELS } from '@/features/display/config/display'
import {
  findFittingUnit,
  fitStyle,
  getColumnBounds,
  getDisplayDensity,
  getFitStages,
  getUnitBounds,
  planFit,
  planStage,
  readableMinUnit,
  type FitResult,
} from './autoFit'

const TV_HEIGHT = 1080
const LAST_DETAIL = DETAIL_LEVELS.length - 1
/** Content `units` em tall in one column (halved, rounded up, in two); each detail level dropped saves `saved` em. */
const contentOf = (units: number, saved = 0) => ({ unit, columns, detail }: FitResult) =>
  Math.ceil((units - detail * saved) / columns) * unit

describe('getDisplayDensity', () => {
  it('uses the compact layout for 2 to 4 TV columns and the editor preview', () => {
    expect(getDisplayDensity(480, TV_HEIGHT)).toBe('compact')
    expect(getDisplayDensity(640, TV_HEIGHT)).toBe('compact')
    expect(getDisplayDensity(960, TV_HEIGHT)).toBe('compact')
    expect(getDisplayDensity(320, 540)).toBe('compact')
  })

  it('keeps the comfortable layout for a full screen', () => {
    expect(getDisplayDensity(1920, TV_HEIGHT)).toBe('comfortable')
  })
})

describe('readable floor', () => {
  it('aims for compact exercise names (1.5em) of 28 px at 3 columns and 24 px at 4 on a 1080 px TV', () => {
    expect(getUnitBounds(640, TV_HEIGHT, 'compact').target * 1.5).toBeGreaterThanOrEqual(28)
    expect(getUnitBounds(480, TV_HEIGHT, 'compact').target * 1.5).toBeGreaterThanOrEqual(25)
    expect(readableMinUnit(TV_HEIGHT, 'compact') * 1.5).toBeGreaterThanOrEqual(23.9)
  })

  it('scales with the container height', () => {
    expect(readableMinUnit(540, 'compact')).toBeCloseTo(readableMinUnit(TV_HEIGHT, 'compact') / 2)
  })

  it('keeps min, target and max in order unless A- pushes the max below them', () => {
    const bounds = getUnitBounds(480, TV_HEIGHT, 'compact')
    expect(bounds.min).toBeLessThan(readableMinUnit(TV_HEIGHT, 'compact'))
    expect(bounds.target).toBeGreaterThan(readableMinUnit(TV_HEIGHT, 'compact'))
    expect(bounds.max).toBeCloseTo(24.96)
    const shrunk = getUnitBounds(480, TV_HEIGHT, 'compact', { fontScale: 0.5 })
    expect(shrunk.min).toBe(shrunk.max)
    expect(shrunk.target).toBe(shrunk.max)
  })
})

describe('target size', () => {
  it('asks for 28 px exercise names at 1080 px in both densities', () => {
    expect(getUnitBounds(640, TV_HEIGHT, 'compact').target * 1.5).toBeGreaterThanOrEqual(28)
    expect(getUnitBounds(1920, TV_HEIGHT, 'comfortable').target * 1.9).toBeGreaterThanOrEqual(28)
  })
})

describe('growing a short day', () => {
  it('lets the names grow to about twice the target (56 px at 1080 px) in both densities, never more', () => {
    for (const [width, density, nameEm] of [[954, 'compact', 1.5], [1920, 'comfortable', 1.9]] as const) {
      const { target, max } = getUnitBounds(width, TV_HEIGHT, density)
      expect(max * nameEm).toBeGreaterThan(56)
      expect(max * nameEm).toBeLessThan(57)
      expect(max / target).toBeGreaterThan(1.9)
      expect(max / target).toBeLessThan(2.1)
    }
  })

  it('a 4-column TV section (480 × 1080) may grow above its target, within its width', () => {
    const { target, max } = getUnitBounds(480, TV_HEIGHT, 'compact')
    expect(max).toBeGreaterThan(target * 1.3)
    expect(max).toBeCloseTo(480 * 0.052)
  })

  const plan = (units: number, wrapsAbove = Infinity, saved = 0) =>
    planFit({
      width: 640,
      height: TV_HEIGHT,
      density: 'compact',
      fontScale: 1,
      canSplit: false,
      measure: contentOf(units, saved),
      wrapsTooMuch: ({ unit }) => unit > wrapsAbove,
    })
  const bounds = getUnitBounds(640, TV_HEIGHT, 'compact')

  it('fills the height with a short day, up to the cap', () => {
    expect(plan(10).unit).toBe(bounds.max)
    const fit = plan(40)
    expect(fit).toMatchObject({ columns: 1, detail: 0 })
    expect(fit.unit * 40).toBeLessThanOrEqual(TV_HEIGHT)
    expect(fit.unit * 40).toBeGreaterThan(TV_HEIGHT * 0.99)
  })

  it('stops growing before a name or prescription would take a third line', () => {
    const limit = (bounds.target + bounds.max) / 2
    const fit = plan(10, limit)
    expect(fit.unit).toBeLessThanOrEqual(limit)
    expect(fit.unit).toBeGreaterThan(limit - 0.1)
  })

  it('the line limit never hides anything or shrinks below the target: it only holds the growth back', () => {
    const atTarget = Math.floor(TV_HEIGHT / bounds.target)
    expect(plan(atTarget, 0)).toEqual({ unit: bounds.target, columns: 1, detail: 0 })
    expect(plan(atTarget + 5, 0, 6)).toMatchObject({ detail: 1 })
  })

  it('shows everything again before growing: a day that fits at the target keeps cues, tempo and icons', () => {
    expect(plan(Math.floor(TV_HEIGHT / bounds.target) - 2, Infinity, 6).detail).toBe(0)
  })

  it('never splits a 4-column section (480 × 1080), however long the day', () => {
    const fit = planFit({ width: 480, height: TV_HEIGHT, density: 'compact', fontScale: 1, canSplit: true, measure: contentOf(300) })
    expect(fit.columns).toBe(1)
    expect(getFitStages(480, TV_HEIGHT, true)).toEqual([{ density: 'compact', strict: false }])
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
  const plan = (width: number, units: number, canSplit = false, saved = 0) =>
    planFit({
      width,
      height: TV_HEIGHT,
      density: getDisplayDensity(width, TV_HEIGHT),
      fontScale: 1,
      canSplit,
      measure: contentOf(units, saved),
    })

  const target = getUnitBounds(640, TV_HEIGHT, 'compact').target

  it('keeps everything when the content fits at the target size', () => {
    const fit = plan(640, 50)
    expect(fit).toMatchObject({ columns: 1, detail: 0 })
    expect(fit.unit).toBeGreaterThanOrEqual(target)
  })

  it('hides secondary content, one level at a time, before going below the target size', () => {
    const atTarget = Math.floor(TV_HEIGHT / target)
    expect(plan(640, atTarget + 5, false, 6).detail).toBe(1)
    expect(plan(640, atTarget + 11, false, 6).detail).toBe(2)
    expect(plan(640, atTarget + 17, false, 6).detail).toBe(3)
    expect(plan(640, atTarget + 23, false, 6).detail).toBe(4)
    expect(plan(640, atTarget + 5, false, 6).unit).toBeGreaterThanOrEqual(target)
  })

  it('shrinks the text only with everything secondary hidden', () => {
    const fit = plan(640, 80, false, 2)
    expect(fit.detail).toBe(LAST_DETAIL)
    expect(fit.unit).toBeLessThan(target)
    expect(fit.unit).toBeGreaterThanOrEqual(getUnitBounds(640, TV_HEIGHT, 'compact').min)
  })

  it('stays at the last-resort size in a narrow slot that cannot split (overflow indicator)', () => {
    expect(plan(480, 120)).toEqual({ unit: getUnitBounds(480, TV_HEIGHT, 'compact').min, columns: 1, detail: LAST_DETAIL })
  })

  it('never splits a column of a TV with 2 or more, however long the day', () => {
    expect(plan(960, 300, false).columns).toBe(1)
    expect(plan(640, 300, false).columns).toBe(1)
  })

  it('never splits a portrait window, even one that may', () => {
    expect(plan(640, 300, true).columns).toBe(1)
    expect(plan(960, 300, true).columns).toBe(1)
  })

  const wideTarget = getUnitBounds(1920, TV_HEIGHT, 'comfortable').target

  it('keeps one column on a landscape screen when it fits at the target size', () => {
    const units = Math.floor(TV_HEIGHT / wideTarget)
    expect(plan(1920, units, true)).toMatchObject({ columns: 1, detail: 0 })
    expect(plan(1920, 40, true).columns).toBe(1)
  })

  it('does not split just to make text bigger', () => {
    const fit = plan(1920, 50, true)
    expect(fit.columns).toBe(1)
    expect(fit.unit).toBeLessThan(getUnitBounds(1920, TV_HEIGHT, 'comfortable').max)
  })

  it('splits only when one column would go below the target size, hiding nothing', () => {
    const fit = plan(1920, Math.floor(TV_HEIGHT / wideTarget) + 2, true, 3)
    expect(fit).toMatchObject({ columns: 2, detail: 0 })
    expect(fit.unit).toBeGreaterThanOrEqual(wideTarget)
  })

  it('prefers two parts when nothing fits, down to the last-resort size', () => {
    const fit = plan(1920, 320, true)
    expect(fit.columns).toBe(2)
    expect(fit.detail).toBe(LAST_DETAIL)
    expect(fit.unit).toBeGreaterThanOrEqual(getUnitBounds(1920, TV_HEIGHT, 'comfortable').min)
  })
})

describe('layouts for one client on a landscape screen', () => {
  const input = (units: number) => ({
    width: 1920,
    height: TV_HEIGHT,
    density: 'comfortable' as const,
    fontScale: 1,
    canSplit: true,
    measure: contentOf(units),
  })

  it('tries one roomy column, one tighter column and only then two parts', () => {
    expect(getFitStages(1920, TV_HEIGHT, true)).toEqual([
      { density: 'comfortable', strict: true },
      { density: 'compact', strict: true },
      { density: 'comfortable', strict: false },
    ])
  })

  it('has a single stage in any other case', () => {
    expect(getFitStages(640, TV_HEIGHT, true)).toEqual([{ density: 'compact', strict: false }])
    expect(getFitStages(960, TV_HEIGHT, false)).toEqual([{ density: 'compact', strict: false }])
    expect(getFitStages(1920, TV_HEIGHT, false)).toEqual([{ density: 'comfortable', strict: false }])
  })

  it('a strict stage holds one column at the target size or passes', () => {
    const fits = planStage(input(40), { density: 'comfortable', strict: true })
    expect(fits).toMatchObject({ columns: 1, detail: 0 })
    expect(planStage(input(200), { density: 'comfortable', strict: true })).toBeNull()
  })

  it('the last stage always gives an answer', () => {
    expect(planStage(input(200), { density: 'comfortable', strict: false })).toMatchObject({ columns: 2 })
  })
})

describe('fitStyle', () => {
  const varsAt = (detail: number) => fitStyle({ unit: 20, columns: 1, detail }) as Record<string, string>

  it('hides the cues first, then the decorations (icons, week), then tempo/rest, then notes', () => {
    expect(varsAt(0)).toMatchObject({ '--display-cue': 'block', '--display-extra': 'block', '--display-detail': 'block' })
    expect(varsAt(1)).toMatchObject({ '--display-cue': 'none', '--display-extra': 'block' })
    expect(varsAt(2)).toMatchObject({ '--display-extra': 'none', '--display-detail': 'block', '--display-note': 'flex' })
    expect(varsAt(3)).toMatchObject({ '--display-detail': 'none', '--display-note': 'flex' })
    expect(varsAt(LAST_DETAIL)).toMatchObject({ '--display-note': 'none' })
  })
})

describe('sections of a 2-row grid (5-6 in 3 × 2, or any half-height landscape slot) on a 1920 × 1080 TV', () => {
  const HALF = 534
  const section = (width: number, units: number, saved = 0, maxUnit?: number) =>
    planFit({
      width,
      height: HALF,
      referenceHeight: TV_HEIGHT,
      density: getDisplayDensity(width, HALF),
      fontScale: 1,
      canSplit: true,
      measure: contentOf(units, saved),
      maxUnit,
    })

  it('aims at the same letter as a full-height column, not half of it', () => {
    const halfBounds = getUnitBounds(954, HALF, 'comfortable', { referenceHeight: TV_HEIGHT })
    expect(halfBounds.target).toBeCloseTo(getUnitBounds(1920, TV_HEIGHT, 'comfortable').target)
    expect(readableMinUnit(TV_HEIGHT, 'comfortable') * 1.9).toBeGreaterThanOrEqual(23.9)
    expect(section(954, 20).unit).toBeGreaterThanOrEqual(halfBounds.target)
  })

  it('a wide section (954 × 534) splits in two parts before hiding anything or shrinking', () => {
    const target = getUnitBounds(954, HALF, 'comfortable', { referenceHeight: TV_HEIGHT }).target
    const fit = section(954, Math.floor(HALF / target) + 6)
    expect(fit).toMatchObject({ columns: 2, detail: 0 })
    expect(fit.unit).toBeGreaterThanOrEqual(target)
  })

  it('a narrow section (632 × 534) is too narrow for two parts at the target: it hides secondary content first', () => {
    const bounds = getUnitBounds(632, HALF, 'comfortable', { referenceHeight: TV_HEIGHT })
    expect(section(632, Math.floor(HALF / bounds.target) + 2, 3)).toMatchObject({ columns: 1, detail: 1 })
    // Only a day that does not fit at all goes to two narrow parts, still above the last-resort size.
    const crowded = section(632, 120)
    expect(crowded).toMatchObject({ columns: 2, detail: LAST_DETAIL })
    expect(crowded.unit).toBeGreaterThanOrEqual(bounds.min)
  })

  it('with a shared size below its own, picks what to show at that size (sections hide the same things)', () => {
    const own = section(954, 10)
    const capped = section(954, 10, 0, own.unit / 2)
    expect(capped.unit).toBeCloseTo(own.unit / 2)
    expect(capped.detail).toBe(0)
  })
})
