import type { Day } from '@/types'

/** 'Día 2 · Pierna' (or just 'Día 2'). */
export function formatDayTitle(day: Pick<Day, 'name' | 'label'>): string {
  const label = day.label.trim()
  return label ? `${day.name} · ${label}` : day.name
}

/** Initials for avatars: 'Laura Martín' → 'LM', 'Dani' → 'DA'. */
export function getInitials(first: string, last = ''): string {
  const f = first.trim()
  const l = last.trim()
  if (f && l) return (f[0] + l[0]).toUpperCase()
  const words = f.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return f.slice(0, 2).toUpperCase() || '?'
}

/** 'Laura Martín' (first + last, trimmed). */
export function formatFullName(first: string, last = ''): string {
  return [first.trim(), last.trim()].filter(Boolean).join(' ')
}

/** Non-empty parts joined on one line: joinParts(['tempo 3-1-1-0', '', 'Pecho alto']) → 'tempo 3-1-1-0 · Pecho alto'. */
export function joinParts(parts: ReadonlyArray<string | null | undefined>, separator = ' · '): string {
  return parts
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(separator)
}

/** Multi-line free text (warm-up) folded onto one flowing line for narrow screens. */
export function foldLines(text: string): string {
  return joinParts(text.split('\n'))
}
