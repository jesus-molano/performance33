/** Entry list shown under a combobox input: null is the leading 'clear' entry. */
export type ComboboxEntry<T> = T | null

/** 'Clear' entry first, then every option (no query) or the filtered ones. */
export function buildComboboxEntries<T>(
  options: readonly T[],
  query: string | null,
  filter: (options: readonly T[], query: string) => T[],
): ComboboxEntry<T>[] {
  return [null, ...(query ? filter(options, query) : options)]
}

/** The highlighted index if it still points at an entry, else -1 (nothing highlighted). */
export const activeEntryIndex = (index: number, length: number): number => (index >= 0 && index < length ? index : -1)

/** ↑/↓ with wrap-around; from 'nothing highlighted' ↓ goes to the first entry and ↑ to the last. */
export function stepIndex(index: number, delta: 1 | -1, length: number): number {
  if (length === 0) return -1
  if (index < 0) return delta > 0 ? 0 : length - 1
  return (index + delta + length) % length
}

/** After typing, highlight the first match (not the 'clear' entry) so Enter picks what was typed. */
export const typedActiveIndex = (query: string): number => (query ? 1 : 0)

/** True when the entry is what is already selected (picking it again must not reset anything). */
export function isSelectedEntry<T>(entry: ComboboxEntry<T>, selected: T | null, getKey: (option: T) => string): boolean {
  if (entry === null || selected === null) return entry === selected
  return getKey(entry) === getKey(selected)
}
