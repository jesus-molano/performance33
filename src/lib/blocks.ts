import { BLOCK_TYPE_META } from '@/config/blockTypes'
import type { Block, BlockType } from '@/types'

interface BlockShape {
  type: BlockType
  exercises: readonly unknown[]
}

type TitledBlock = BlockShape & Pick<Block, 'title'>

/** Automatic title. Superset by count: 2 → 'Biserie', 3 → 'Triserie', else 'Superserie'. */
export function getAutoBlockTitle(block: BlockShape): string {
  if (block.type === 'superset') {
    const count = block.exercises.length
    if (count === 2) return 'Biserie'
    if (count === 3) return 'Triserie'
    return 'Superserie'
  }
  if (block.type === 'normal') return 'Fuerza'
  return BLOCK_TYPE_META[block.type].label
}

/** Title shown for a block: custom title if set, else automatic from type. */
export function getBlockTitle(block: TitledBlock): string {
  return block.title.trim() || getAutoBlockTitle(block)
}

/** True when a superset has 4+ exercises (UI may suggest 'Cambiar a circuito'). */
export function shouldSuggestCircuit(block: BlockShape): boolean {
  return block.type === 'superset' && block.exercises.length >= 4
}

/** Whether rows in this block type show 'series' (false = rounds are block-level). */
export function blockShowsSets(type: BlockType): boolean {
  return BLOCK_TYPE_META[type].rowsHaveSets
}

/** Warm-up and mobility blocks are de-emphasised and excluded from A/B lettering. */
export function isAccessoryBlock(type: BlockType): boolean {
  return BLOCK_TYPE_META[type].muted
}
