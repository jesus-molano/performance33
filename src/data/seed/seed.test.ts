import { describe, expect, it } from 'vitest'
import { createSeedData } from './index'

/** Library ids that finish overhead (presses, jerks, snatches, thrusters, wall balls, handstands…). */
const OVERHEAD_ID = /press-(militar|hombro|arnold|z|bottom-up|landmine)|push-press|jerk|arrancada|snatch|thruster|wall-ball|overhead|pino|devil-press|americano|turkish/

describe('createSeedData', () => {
  const data = createSeedData('2026-10-31')
  const days = data.programs.flatMap((p) => p.days)
  const blocks = days.flatMap((d) => d.blocks)

  it('gives every routine day a realistic 4-5 blocks', () => {
    for (const day of days) {
      expect(day.blocks.length).toBeGreaterThanOrEqual(4)
      expect(day.blocks.length).toBeLessThanOrEqual(5)
    }
  })

  it('includes the density stress cases (a 5-block day and a 5-exercise block)', () => {
    expect(days.some((d) => d.blocks.length === 5)).toBe(true)
    expect(blocks.some((b) => b.exercises.length >= 5)).toBe(true)
  })

  it('keeps blocks short: 2-5 exercises, or free text for warm-ups', () => {
    for (const block of blocks) {
      if (block.text) continue
      expect(block.exercises.length).toBeGreaterThanOrEqual(block.type === 'normal' ? 1 : 2)
      expect(block.exercises.length).toBeLessThanOrEqual(5)
    }
  })

  it('keeps overhead work out of the programs of Laura (shoulder rule)', () => {
    const laura = data.clients.find((c) => c.firstName === 'Laura')
    const ids = data.programs
      .filter((p) => p.clientId === laura?.id)
      .flatMap((p) => p.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises.map((e) => e.libraryId ?? ''))))
    expect(ids.length).toBeGreaterThan(0)
    expect(ids.filter((id) => OVERHEAD_ID.test(id))).toEqual([])
  })

  it('has weekly progressions', () => {
    const progressed = blocks.flatMap((b) => b.exercises).filter((e) => e.progression)
    expect(progressed.length).toBeGreaterThanOrEqual(5)
  })
})
