import { luminance } from '../../../lib/color'

const WHITE = '#ffffff'

/** WCAG contrast ratio between two #rrggbb colours (1..21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

export function contrastOnWhite(color: string): number {
  return contrastRatio(color, WHITE)
}
