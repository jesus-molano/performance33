import { formatNumber } from '../numbers.ts'

/** Seconds → TV style: 30 → '30″', 90 → '1′30″', 120 → '2′'. */
export function formatSeconds(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return ''
  const s = Math.max(0, Math.round(sec))
  if (s < 60) return `${s}″`
  const minutes = Math.floor(s / 60)
  const rest = s % 60
  return rest ? `${minutes}′${String(rest).padStart(2, '0')}″` : `${minutes}′`
}

/** Rest → '30s', '90s', '2 min', '2 min 30s'. */
export function formatRest(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return ''
  const s = Math.round(sec)
  if (s <= 90) return `${s}s`
  const minutes = Math.floor(s / 60)
  const rest = s % 60
  return rest ? `${minutes} min ${rest}s` : `${minutes} min`
}

/** Minutes → '12′'. */
export function formatMinutes(min: number | null | undefined): string {
  if (min == null || !Number.isFinite(min)) return ''
  return `${formatNumber(min)}′`
}

/** Metres → '400 m', '1,5 km'. */
export function formatDistance(metres: number | null | undefined): string {
  if (metres == null || !Number.isFinite(metres)) return ''
  return metres >= 1000 ? `${formatNumber(metres / 1000)} km` : `${formatNumber(metres)} m`
}

/** Calories → '15 cal'. */
export function formatCalories(cal: number | null | undefined): string {
  if (cal == null || !Number.isFinite(cal)) return ''
  return `${formatNumber(cal)} cal`
}

/** Spanish count with noun: plural(3, 'ronda', 'rondas') → '3 rondas'. */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
