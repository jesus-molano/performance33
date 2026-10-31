import { AVATAR_COLORS } from '../config/colors'

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
