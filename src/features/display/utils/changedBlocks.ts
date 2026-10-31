import type { DisplayDay } from '../../../lib/display'

/** Ids of blocks that were added or whose visible content changed between two versions of a day. */
export function findChangedBlockIds(prev: DisplayDay, next: DisplayDay): Set<string> {
  const before = new Map(prev.blocks.map((b) => [b.id, JSON.stringify(b)]))
  return new Set(next.blocks.filter((b) => before.get(b.id) !== JSON.stringify(b)).map((b) => b.id))
}
