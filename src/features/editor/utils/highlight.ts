import { NO_HIGHLIGHT } from '@/features/editor/config'

/** Next highlighted option with ↑/↓, wrapping around. From no highlight, ↓ starts at the top and ↑ at the bottom. */
export function moveHighlight(current: number, delta: 1 | -1, optionCount: number): number {
  if (optionCount <= 0) return NO_HIGHLIGHT
  if (current === NO_HIGHLIGHT) return delta === 1 ? 0 : optionCount - 1
  return (current + delta + optionCount) % optionCount
}
