import type { DisplayBlock } from '@/lib/display'

/** Overline above the headline, only when it adds information (a custom title like 'Fuerza'). */
export function getBlockOverline(block: DisplayBlock): string | null {
  return block.headline.toLowerCase().includes(block.title.toLowerCase()) ? null : block.title
}

/** Acronym badge, only when the headline does not already spell it. */
export function getVisibleBadge(block: DisplayBlock): string | null {
  if (!block.badge) return null
  return block.headline.toUpperCase().includes(block.badge) ? null : block.badge
}
