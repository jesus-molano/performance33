import { describe, expect, it } from 'vitest'
import { createChunkedStorage, splitIntoChunks, type AsyncKeyValueStore } from './chunkedStorage'

function memoryStore(): AsyncKeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => void data.set(key, value),
    removeItem: async (key) => void data.delete(key),
  }
}

describe('splitIntoChunks', () => {
  it('cuts a value into pieces of at most the size', () => {
    expect(splitIntoChunks('abcdefg', 3)).toEqual(['abc', 'def', 'g'])
    expect(splitIntoChunks('', 3)).toEqual([])
  })
})

describe('createChunkedStorage', () => {
  it('stores a long value in pieces and reads it back whole', async () => {
    const store = memoryStore()
    const storage = createChunkedStorage(store, 4)
    await storage.setItem('session', 'abcdefghij')
    expect(store.data.get('session')).toBe('chunks:3')
    expect(store.data.get('session.0')).toBe('abcd')
    expect(await storage.getItem('session')).toBe('abcdefghij')
  })

  it('removes the old pieces when a shorter value replaces a longer one', async () => {
    const store = memoryStore()
    const storage = createChunkedStorage(store, 4)
    await storage.setItem('session', 'abcdefghij')
    await storage.setItem('session', 'xy')
    expect([...store.data.keys()].sort()).toEqual(['session', 'session.0'])
    expect(await storage.getItem('session')).toBe('xy')
  })

  it('gives no value when a piece is missing, and nothing after removing', async () => {
    const store = memoryStore()
    const storage = createChunkedStorage(store, 4)
    await storage.setItem('session', 'abcdefghij')
    store.data.delete('session.1')
    expect(await storage.getItem('session')).toBeNull()
    await storage.removeItem('session')
    expect(store.data.size).toBe(0)
  })

  it('reads a value saved whole', async () => {
    const store = memoryStore()
    store.data.set('session', '{"a":1}')
    expect(await createChunkedStorage(store, 4).getItem('session')).toBe('{"a":1}')
  })
})
