function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Deep equality of JSON-like values. Key order does not matter (the database reorders keys) and a
 * key holding `undefined` equals a missing key (JSON drops it).
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (!isObject(a) || !isObject(b)) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) if (!deepEqual(a[key], b[key])) return false
  return true
}
