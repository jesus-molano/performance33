import { nanoid } from 'nanoid'

/** Short unique id with an optional readable prefix, e.g. newId('ex') → 'ex_V1StGXR8_Z'. */
export function newId(prefix?: string): string {
  const id = nanoid(10)
  return prefix ? `${prefix}_${id}` : id
}
