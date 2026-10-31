import type { Block, PublicBlock } from '../../types'
import { isAccessoryBlock } from '../blocks'

type BlockLike = Pick<PublicBlock | Block, 'type' | 'params' | 'exercises'>

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function numbered(count: number): Array<string | null> {
  return count > 1 ? Array.from({ length: count }, (_, i) => String(i + 1)) : Array(count).fill(null)
}

/** Superset letter = position among the day's main (non warm-up/mobility) blocks. */
function supersetLetter(blocks: BlockLike[], blockIndex: number): string {
  const mainBefore = blocks.slice(0, blockIndex).filter((b) => !isAccessoryBlock(b.type)).length
  return LETTERS[mainBefore % LETTERS.length]
}

/**
 * Per-exercise labels for block `blockIndex` of a day, derived from position (never typed):
 * superset → 'A1','A2'; circuit/fortime/amrap/tabata → '1','2'…;
 * EMOM with 2+ rows → 'Min 1','Min 2' (or start minute "1′","3′" when everyMin > 1); else null.
 */
export function getExerciseLabels(blocks: BlockLike[], blockIndex: number): Array<string | null> {
  const block = blocks[blockIndex]
  if (!block) return []
  const count = block.exercises.length
  switch (block.type) {
    case 'superset': {
      const letter = supersetLetter(blocks, blockIndex)
      return Array.from({ length: count }, (_, i) => `${letter}${i + 1}`)
    }
    case 'circuit':
    case 'fortime':
    case 'amrap':
    case 'tabata':
      return numbered(count)
    case 'emom': {
      const every = block.params.everyMin ?? 1
      if (count <= 1) return Array(count).fill(null)
      return Array.from({ length: count }, (_, i) => (every === 1 ? `Min ${i + 1}` : `${i * every + 1}′`))
    }
    default:
      return Array(count).fill(null)
  }
}
