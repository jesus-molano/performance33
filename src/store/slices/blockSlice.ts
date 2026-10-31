import { BLOCK_TYPE_META } from '../../config/blockTypes'
import { insertAt, moveItem, removeById } from '../../lib/arrays'
import { cloneBlock, createBlock, createExercise } from '../../lib/factories'
import type { BlockParams } from '../../types'
import { blockAt, locateBlock, locateDay, sameDay, withBlock, withDay, withProgram } from '../locate'
import type { BlockActions, SliceContext } from '../types'
import { groupKey } from '../undoGroup'
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
      commit((d) => withDay(d, loc, (day) => ({ ...day, blocks: insertAt(day.blocks, opts.index ?? day.blocks.length, block) })))
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
      commit((d) => withDay(d, loc, (day) => ({ ...day, blocks: insertAt(day.blocks, loc.bi + 1, copy) })))
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
      const block = blockAt(data, from)
      commit((d) =>
        withDay(
          withDay(d, from, (day) => ({ ...day, blocks: removeById(day.blocks, blockId) })),
          to,
          (day) => ({ ...day, blocks: insertAt(day.blocks, toIndex, block) }),
        ),
      )
    },
    copyBlockToDay: (blockId, dayId) => {
      const data = getData()
      const from = locateBlock(data, blockId)
      const to = locateDay(data, dayId)
      if (!from || !to) return ''
      let copyId = ''
      commit((d) =>
        withDay(d, to, (day) => {
          const result = copyIntoDay(day, blockAt(data, from))
          copyId = result.copy.id
          return result.day
        }),
      )
      return copyId
    },
    copyBlockToAllDays: (blockId) => {
      const data = getData()
      const from = locateBlock(data, blockId)
      if (!from) return 0
      const source = blockAt(data, from)
      commit((d) =>
        withProgram(d, from.pi, (p) => ({
          ...p,
          days: p.days.map((day, di) => (di === from.di ? day : copyIntoDayAt(day, source, from.bi))),
        })),
      )
      return data.programs[from.pi].days.length - 1
    },
  }
}
