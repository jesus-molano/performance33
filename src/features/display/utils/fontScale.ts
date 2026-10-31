import { clamp } from '../../../lib/numbers'
import { FONT_SCALE } from '../config/display'

/** Next A-/A+ multiplier, rounded to one decimal and kept within bounds. */
export function stepFontScale(current: number, direction: 1 | -1): number {
  const next = Math.round((current + direction * FONT_SCALE.step) * 10) / 10
  return clamp(next, FONT_SCALE.min, FONT_SCALE.max)
}

export function parseFontScale(raw: string | null): number {
  const n = Number(raw)
  return raw && Number.isFinite(n) && n > 0 ? clamp(n, FONT_SCALE.min, FONT_SCALE.max) : FONT_SCALE.initial
}
