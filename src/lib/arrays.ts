// Immutable array helpers (always return new arrays).

export function replaceAt<T>(items: readonly T[], index: number, update: (item: T) => T): T[] {
  return items.map((item, i) => (i === index ? update(item) : item))
}

/** Insert at index (clamped to 0..length). */
export function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  const copy = items.slice()
  copy.splice(Math.max(0, Math.min(index, copy.length)), 0, item)
  return copy
}

/** Move the item at `from` to `to` (clamped). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const copy = items.slice()
  const [item] = copy.splice(from, 1)
  copy.splice(Math.max(0, Math.min(to, copy.length)), 0, item)
  return copy
}

export function removeById<T extends { id: string }>(items: readonly T[], id: string): T[] {
  return items.filter((item) => item.id !== id)
}

export function updateById<T extends { id: string }>(items: readonly T[], id: string, update: (item: T) => T): T[] {
  return items.map((item) => (item.id === id ? update(item) : item))
}

/** Consecutive pieces of at most `size` items. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const pieces: T[][] = []
  for (let start = 0; start < items.length; start += size) pieces.push(items.slice(start, start + size))
  return pieces
}
