import { AVATAR_COLORS } from '@/config/colors'
import { normalizeText } from '@/lib/search'
import type { Coach } from '@/types'

export const COACH_NAME_MAX_LENGTH = 30

/** Spanish validation message for a coach name, or undefined when valid. */
export function validateCoachName(name: string, coaches: readonly Coach[], selfId: string | null): string | undefined {
  const clean = normalizeText(name)
  if (!clean) return 'Escribe un nombre.'
  const taken = coaches.some((c) => c.id !== selfId && normalizeText(c.name) === clean)
  return taken ? 'Ya hay un monitor con ese nombre.' : undefined
}

/** First palette colour not used by another coach (so new profiles look distinct). */
export function suggestCoachColor(coaches: readonly Coach[]): string {
  const used = new Set(coaches.map((c) => c.color.toLowerCase()))
  return AVATAR_COLORS.find((color) => !used.has(color.toLowerCase())) ?? AVATAR_COLORS[0]
}
