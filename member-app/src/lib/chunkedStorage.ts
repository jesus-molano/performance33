// A key-value store that keeps long values in pieces. SecureStore warns above 2 KB per value and a Supabase session
// (two tokens and the user) is often longer, so `key` holds how many pieces there are and `key.0`, `key.1`… hold them.

export interface AsyncKeyValueStore {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

const COUNT_PREFIX = 'chunks:'

const chunkKey = (key: string, index: number) => `${key}.${index}`

function parseCount(stored: string | null): number | null {
  if (!stored?.startsWith(COUNT_PREFIX)) return null
  const count = Number(stored.slice(COUNT_PREFIX.length))
  return Number.isInteger(count) && count >= 0 ? count : null
}

/** Splits `value` into pieces of at most `size` characters ('' gives no pieces). */
export function splitIntoChunks(value: string, size: number): string[] {
  if (size < 1) throw new RangeError('size must be at least 1')
  const chunks: string[] = []
  for (let start = 0; start < value.length; start += size) chunks.push(value.slice(start, start + size))
  return chunks
}

export function createChunkedStorage(store: AsyncKeyValueStore, chunkSize: number): AsyncKeyValueStore {
  async function removeChunks(key: string): Promise<void> {
    const count = parseCount(await store.getItem(key))
    if (count === null) return
    await Promise.all(Array.from({ length: count }, (_, i) => store.removeItem(chunkKey(key, i))))
  }

  return {
    async getItem(key) {
      const stored = await store.getItem(key)
      const count = parseCount(stored)
      // A value saved whole (short, or by an older version) is read as it is.
      if (count === null) return stored
      const chunks = await Promise.all(Array.from({ length: count }, (_, i) => store.getItem(chunkKey(key, i))))
      // A piece missing means a write was cut short: better no session than half of one.
      return chunks.every((chunk): chunk is string => chunk !== null) ? chunks.join('') : null
    },

    async setItem(key, value) {
      await removeChunks(key)
      const chunks = splitIntoChunks(value, chunkSize)
      await Promise.all(chunks.map((chunk, i) => store.setItem(chunkKey(key, i), chunk)))
      // The count goes last: until then a reader finds the old count or none.
      await store.setItem(key, `${COUNT_PREFIX}${chunks.length}`)
    },

    async removeItem(key) {
      await removeChunks(key)
      await store.removeItem(key)
    },
  }
}
