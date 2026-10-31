/** Index after moving by `delta`, or null when it would leave the list. */
export function neighborIndex(index: number, delta: -1 | 1, length: number): number | null {
  const next = index + delta
  return next < 0 || next >= length ? null : next
}
