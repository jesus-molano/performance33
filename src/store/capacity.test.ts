import { beforeEach, describe, expect, it } from 'vitest'
import { EXERCISE_NAME_MAX_LENGTH, MAX_BLOCKS_PER_DAY, MAX_DAYS_PER_PROGRAM, MAX_EXERCISES_PER_BLOCK } from '@/config/capacity'
import { createSeedData } from '@/data/seed'
import { createBlock, createDay, createExercise } from '@/lib/factories'
import type { AppData, Block, Day, Program } from '@/types'
import { useAppStore } from './appStore'
import { hydrateData } from './history'

const exercises = (count: number) => Array.from({ length: count }, () => createExercise({ name: 'Remo' }))
const normalBlock = (count: number): Block => createBlock('normal', { exercises: exercises(count) })
const dayWith = (...sizes: number[]): Day => ({ ...createDay(0, {}), blocks: sizes.map(normalBlock) })

function load(...days: Day[]): Program {
  const seed: AppData = createSeedData('2026-10-31')
  const program: Program = { ...seed.programs[0], days }
  hydrateData({ ...seed, programs: [program] })
  return program
}

const actions = () => useAppStore.getState()
const storedDays = () => actions().data.programs[0].days

describe('capacity limits in store actions', () => {
  let full: Day
  let empty: Day

  beforeEach(() => {
    full = dayWith(...Array.from({ length: MAX_BLOCKS_PER_DAY }, () => 1))
    empty = dayWith(1)
    load(full, empty)
  })

  it('refuses a block over the limit, by adding, duplicating, copying or moving', () => {
    const before = actions().data
    const source = empty.blocks[0].id
    expect(actions().addBlock(full.id, 'normal')).toBe('')
    expect(actions().duplicateBlock(full.blocks[0].id)).toBe('')
    expect(actions().copyBlockToDay(source, full.id)).toBe('')
    actions().moveBlock(source, full.id, 0)
    expect(actions().data).toBe(before)
  })

  it('still reorders within a full day and moves out of it', () => {
    actions().moveBlock(full.blocks[0].id, full.id, 2)
    expect(storedDays()[0].blocks[2].id).toBe(full.blocks[0].id)
    actions().moveBlock(full.blocks[0].id, empty.id, 0)
    expect(storedDays()[0].blocks).toHaveLength(MAX_BLOCKS_PER_DAY - 1)
    expect(storedDays()[1].blocks).toHaveLength(2)
  })

  it('copies to all days only where it fits and says how many', () => {
    expect(actions().copyBlockToAllDays(empty.blocks[0].id)).toBe(0)
    const third = dayWith(1)
    load(full, empty, third)
    expect(actions().copyBlockToAllDays(empty.blocks[0].id)).toBe(1)
    expect(storedDays()[0].blocks).toHaveLength(MAX_BLOCKS_PER_DAY)
    expect(storedDays()[2].blocks).toHaveLength(2)
  })

  it('refuses an exercise over the block limit, by adding, duplicating or moving', () => {
    const day = dayWith(MAX_EXERCISES_PER_BLOCK, 1)
    load(day)
    const before = actions().data
    const [fullBlock, other] = day.blocks
    expect(actions().addExercise(fullBlock.id)).toBe('')
    expect(actions().duplicateExercise(fullBlock.exercises[0].id)).toBe('')
    actions().moveExercise(other.exercises[0].id, fullBlock.id, 0)
    expect(actions().data).toBe(before)
  })

  it('refuses an exercise over the day limit', () => {
    const day = dayWith(4, 4, 4, 4)
    const other = dayWith(1)
    load(day, other)
    const before = actions().data
    expect(actions().addExercise(day.blocks[0].id)).toBe('')
    actions().moveExercise(other.blocks[0].exercises[0].id, day.blocks[0].id, 0)
    expect(actions().data).toBe(before)
    actions().moveExercise(day.blocks[0].exercises[0].id, day.blocks[1].id, 0)
    expect(storedDays()[0].blocks[1].exercises).toHaveLength(5)
  })

  it('leaves over-limit data intact: it can be reordered and reduced, not grown', () => {
    const day = dayWith(7, 7, 7, 1, 1, 1)
    load(day)
    expect(actions().addBlock(day.id, 'normal')).toBe('')
    expect(actions().addExercise(day.blocks[3].id)).toBe('')
    actions().moveBlock(day.blocks[0].id, day.id, 1)
    expect(storedDays()[0].blocks[1].id).toBe(day.blocks[0].id)
    actions().deleteExercise(day.blocks[1].exercises[0].id)
    expect(storedDays()[0].blocks[0].exercises).toHaveLength(6)
  })

  it('cuts names over the maximum length', () => {
    const id = empty.blocks[0].exercises[0].id
    actions().updateExercise(id, { name: 'x'.repeat(100) })
    expect(storedDays()[1].blocks[0].exercises[0].name).toHaveLength(EXERCISE_NAME_MAX_LENGTH)
  })
})

describe('days per routine', () => {
  const programDays = () => actions().data.programs[0].days

  it('refuses a day over the maximum, by adding or duplicating', () => {
    load(...Array.from({ length: MAX_DAYS_PER_PROGRAM }, () => dayWith(1)))
    const before = actions().data
    expect(actions().addDay(before.programs[0].id)).toBe('')
    expect(actions().duplicateDay(programDays()[0].id)).toBe('')
    expect(actions().data).toBe(before)
  })

  it('accepts the last day that fits', () => {
    load(...Array.from({ length: MAX_DAYS_PER_PROGRAM - 1 }, () => dayWith(1)))
    expect(actions().addDay(actions().data.programs[0].id)).not.toBe('')
    expect(programDays()).toHaveLength(MAX_DAYS_PER_PROGRAM)
  })

  it('keeps an imported routine over the maximum, and lets it shrink but not grow', () => {
    load(...Array.from({ length: MAX_DAYS_PER_PROGRAM + 2 }, () => dayWith(1)))
    expect(actions().addDay(actions().data.programs[0].id)).toBe('')
    actions().deleteDay(programDays()[0].id)
    expect(programDays()).toHaveLength(MAX_DAYS_PER_PROGRAM + 1)
  })

  it('creates new routines within the maximum, whatever is asked for', () => {
    load(dayWith(1))
    const client = actions().data.clients[0].id
    const id = actions().createProgram(client, { dayCount: MAX_DAYS_PER_PROGRAM + 3 })
    expect(actions().data.programs.find((p) => p.id === id)?.days).toHaveLength(MAX_DAYS_PER_PROGRAM)
  })
})
