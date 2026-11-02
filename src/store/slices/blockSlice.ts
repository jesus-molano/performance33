import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { insertAt, moveItem, removeById } from '@/lib/arrays'
import { getDayChangeRefusal } from '@/lib/capacity'
import { cloneBlock, createBlock, createExercise } from '@/lib/factories'
import type { BlockParams } from '@/types'
import { blockAt, dayAt, locateBlock, locateDay, sameDay, withBlock, withDay, withProgram } from '@/store/locate'
import type { BlockActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'
import { copyIntoDay, copyIntoDayAt } from './blockCopy'

function mergeParams(current: BlockParams, patch: Partial<BlockParams>): BlockParams {
  const merged: BlockParams = { ...current, ...patch }
  for (const key of Object.keys(merged) as Array<keyof BlockParams>) {
    if (merged[key] === undefined) delete merged[key]
  }
  return merged
}

export function createBlockSlice({ commit, getData }: SliceContext): BlockActions {
  return {
    addBlock: (dayId, type, opts = {}) => {
      const loc = locateDay(getData(), dayId)
      if (!loc) return ''
      const block = createBlock(type, { exercises: opts.withExercise ? [createExercise()] : [] })
      const day = dayAt(getData(), loc)
      const next = { ...day, blocks: insertAt(day.blocks, opts.index ?? day.blocks.length, block) }
      if (getDayChangeRefusal(day, next)) return ''
      commit((d) => withDay(d, loc, () => next))
      return block.id
    },
    updateBlock: (blockId, patch) => {
      const loc = locateBlock(getData(), blockId)
      if (!loc) return
      commit((d) => withBlock(d, loc, (b) => ({ ...b, ...patch })), groupKey('block', blockId, patch))
    },
    updateBlockParams: (blockId, patch) => {
      const loc = locateBlock(getData(), blockId)
      if (!loc) return
      commit((d) => withBlock(d, loc, (b) => ({ ...b, params: mergeParams(b.params, patch) })), groupKey('params', blockId, patch))
    },
    changeBlockType: (blockId, type) => {
      const loc = locateBlock(getData(), blockId)
      if (!loc || blockAt(getData(), loc).type === type) return
      commit((d) =>
        withBlock(d, loc, (b) => ({ ...b, type, params: { ...BLOCK_TYPE_META[type].defaultParams, ...b.params } })),
      )
    },
    duplicateBlock: (blockId) => {
      const loc = locateBlock(getData(), blockId)
      if (!loc) return ''
      const copy = cloneBlock(blockAt(getData(), loc))
      const day = dayAt(getData(), loc)
      const next = { ...day, blocks: insertAt(day.blocks, loc.bi + 1, copy) }
      if (getDayChangeRefusal(day, next)) return ''
      commit((d) => withDay(d, loc, () => next))
      return copy.id
    },
    deleteBlock: (blockId) => {
      const loc = locateBlock(getData(), blockId)
      if (!loc) return
      commit((d) => withDay(d, loc, (day) => ({ ...day, blocks: removeById(day.blocks, blockId) })))
    },
    moveBlock: (blockId, toDayId, toIndex) => {
      const data = getData()
      const from = locateBlock(data, blockId)
      const to = locateDay(data, toDayId)
      if (!from || !to) return
      if (sameDay(from, to)) {
        if (from.bi !== toIndex) commit((d) => withDay(d, from, (day) => ({ ...day, blocks: moveItem(day.blocks, from.bi, toIndex) })))
        return
      }
      const target = dayAt(data, to)
      const next = { ...target, blocks: insertAt(target.blocks, toIndex, blockAt(data, from)) }
      if (getDayChangeRefusal(target, next)) return
      commit((d) => withDay(withDay(d, from, (day) => ({ ...day, blocks: removeById(day.blocks, blockId) })), to, () => next))
    },
    copyBlockToDay: (blockId, dayId) => {
      const data = getData()
      const from = locateBlock(data, blockId)
      const to = locateDay(data, dayId)
      if (!from || !to) return ''
      const target = dayAt(data, to)
      const { day: next, copy } = copyIntoDay(target, blockAt(data, from))
      if (getDayChangeRefusal(target, next)) return ''
      commit((d) => withDay(d, to, () => next))
      return copy.id
    },
    copyBlockToAllDays: (blockId) => {
      const data = getData()
      const from = locateBlock(data, blockId)
      if (!from) return 0
      const source = blockAt(data, from)
      const { days } = data.programs[from.pi]
      const nextDays = days.map((day, di) => {
        if (di === from.di) return day
        const next = copyIntoDayAt(day, source, from.bi)
        return getDayChangeRefusal(day, next) ? day : next
      })
      const copied = nextDays.filter((day, di) => day !== days[di]).length
      if (copied > 0) commit((d) => withProgram(d, from.pi, (p) => ({ ...p, days: nextDays })))
      return copied
    },
  }
}
