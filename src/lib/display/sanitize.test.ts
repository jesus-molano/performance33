import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { createBlock, createExercise } from '@/lib/factories'
import { toDisplayData } from './sanitize'

const TODAY = '2026-10-31'

describe('toDisplayData', () => {
  const data = createSeedData(TODAY)
  const display = toDisplayData(data)
  const json = JSON.stringify(display)

  it('never contains private fields', () => {
    expect(json).not.toContain('internalNote')
    expect(json).not.toContain('"goal"')
    expect(json).not.toContain('createdBy')
    expect(display).not.toHaveProperty('notes')
    expect(display).not.toHaveProperty('coaches')
  })

  it('sends the surname for the TV client picker', () => {
    expect(display.clients.map((c) => c.lastName)).toEqual(data.clients.map((c) => c.lastName))
  })

  it('never contains the text of any client note', () => {
    for (const note of data.notes) expect(json).not.toContain(note.text)
  })

  it('drops rows that have no name yet', () => {
    const program = data.programs[0]
    const block = createBlock('normal', { exercises: [createExercise({ name: 'Remo' }), createExercise({ name: '  ' })] })
    const withEmptyRow = { ...data, programs: [{ ...program, days: [{ ...program.days[0], blocks: [block] }] }] }
    const exercises = toDisplayData(withEmptyRow).programs[0].days[0].blocks[0].exercises
    expect(exercises.map((e) => e.name)).toEqual(['Remo'])
  })
})
