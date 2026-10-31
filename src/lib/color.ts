import { AVATAR_COLORS } from '@/config/colors'

/** Is this a valid #rrggbb colour? */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

/** Relative luminance of a #rrggbb colour (0..1). */
export function luminance(hex: string): number {
  if (!isHexColor(hex)) return 0
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** '#000000' or '#ffffff', whichever reads better on `background`. */
export function readableTextOn(background: string): string {
  return luminance(background) > 0.45 ? '#000000' : '#ffffff'
}

/** Deterministic avatar colour for a string (e.g. a name). */
export function pickColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/** WCAG contrast ratio between two #rrggbb colours (1..21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** Mix `hex` toward `target` by `amount` (0..1). */
export function mixColors(hex: string, target: string, amount: number): string {
  const channel = (color: string, i: number) => parseInt(color.slice(i, i + 2), 16)
  return `#${[1, 3, 5]
    .map((i) => Math.round(channel(hex, i) + (channel(target, i) - channel(hex, i)) * amount))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}

/** `color`, or the closest tint toward `toward` that reaches `minRatio` against `background`. */
export function ensureContrast(color: string, background: string, minRatio: number, toward = '#ffffff'): string {
  if (!isHexColor(color)) return color
  for (let step = 0; step <= 10; step++) {
    const candidate = mixColors(color, toward, step / 10)
    if (contrastRatio(candidate, background) >= minRatio) return candidate
  }
  return toward
}
