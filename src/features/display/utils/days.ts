/** 1-based day navigation that wraps around: after the last day comes Día 1 again. */
export function wrapDayNumber(day: number, count: number): number {
  if (count <= 0) return 1
  return ((((day - 1) % count) + count) % count) + 1
}
