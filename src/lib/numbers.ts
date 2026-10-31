/** Parse a number out of free text: '22,5 kg' → 22.5, 'KB 16' → 16, 'máx' → null. */
export function parseNumber(text: string | number | null | undefined): number | null {
  if (text == null) return null
  if (typeof text === 'number') return Number.isFinite(text) ? text : null
  const match = /-?\d+(?:[.,]\d+)?/.exec(text)
  if (!match) return null
  const n = Number(match[0].replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** True when the whole text is a plain number ('60', '22,5'). */
export function isPlainNumber(text: string): boolean {
  return /^-?\d+(?:[.,]\d+)?$/.test(text.trim())
}

/** Spanish number without trailing zeros: 22.5 → '22,5', 20 → '20'. */
export function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return String(rounded).replace('.', ',')
}

/** Parse an optional positive integer from an input value ('' → null). */
export function parseOptionalInt(value: string): number | null {
  const n = parseNumber(value)
  return n == null ? null : Math.max(0, Math.round(n))
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
