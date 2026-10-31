import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useClickOutside } from '@/hooks'
import {
  activeEntryIndex,
  buildComboboxEntries,
  isSelectedEntry,
  stepIndex,
  typedActiveIndex,
  type ComboboxEntry,
} from '@/features/display/utils/combobox'

export interface ComboboxSearchOptions<T> {
  options: readonly T[]
  selected: T | null
  getKey: (option: T) => string
  getLabel: (option: T) => string
  filter: (options: readonly T[], query: string) => T[]
  /** null = the leading 'clear' entry. Not called when the entry is already selected. */
  onSelect: (option: T | null) => void
  /** Lets the parent keep its fading overlay visible while the list is open. */
  onOpenChange?: (open: boolean) => void
}

/**
 * State of a searchable single-select combobox (ARIA 1.2 pattern): the input shows the selected label
 * until the viewer types, then filters; ↑/↓ move, Enter picks, Esc/Tab/click outside close.
 */
export function useComboboxSearch<T>({ options, selected, getKey, getLabel, filter, onSelect, onOpenChange }: ComboboxSearchOptions<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const outsideRefs = useMemo(() => [rootRef], [])

  const entries = useMemo(() => buildComboboxEntries(options, query, filter), [options, query, filter])
  const activeIndex = activeEntryIndex(highlighted, entries.length)
  const selectedIndex = entries.findIndex((e) => isSelectedEntry(e, selected, getKey))
  const optionId = (index: number) => `${listId}-${index}`

  const close = () => {
    setOpen(false)
    setQuery(null)
  }
  const openList = () => {
    if (open) return
    setOpen(true)
    setHighlighted(Math.max(0, selectedIndex))
  }
  const select = (entry: ComboboxEntry<T>) => {
    if (!isSelectedEntry(entry, selected, getKey)) onSelect(entry)
    close()
    // Focus stays in the input after a pick: select its text so the next keystroke starts a new search.
    requestAnimationFrame(() => inputRef.current?.select())
  }

  useClickOutside(outsideRefs, close, open)

  useEffect(() => onOpenChange?.(open), [open, onOpenChange])

  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setOpen(true)
    setHighlighted(typedActiveIndex(event.target.value))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const step = (delta: 1 | -1) => setHighlighted(stepIndex(activeIndex, delta, entries.length))
    const handlers: Record<string, () => void> = {
      ArrowDown: () => (open ? step(1) : openList()),
      ArrowUp: () => (open ? step(-1) : openList()),
      Enter: () => open && activeIndex >= 0 && select(entries[activeIndex]),
      Escape: () => (open ? close() : event.currentTarget.blur()),
    }
    if (event.key === 'Tab') return close()
    const handler = handlers[event.key]
    if (!handler) return
    event.preventDefault()
    handler()
  }

  return {
    open,
    hasQuery: Boolean(query),
    entries,
    activeIndex,
    setActiveIndex: setHighlighted,
    select,
    optionId,
    rootRef,
    listRef,
    listId,
    inputProps: {
      ref: inputRef,
      role: 'combobox' as const,
      value: query ?? (selected ? getLabel(selected) : ''),
      'aria-expanded': open,
      'aria-controls': listId,
      'aria-autocomplete': 'list' as const,
      'aria-activedescendant': open && activeIndex >= 0 ? optionId(activeIndex) : undefined,
      onChange,
      onKeyDown,
      onFocus: (event: { currentTarget: HTMLInputElement }) => {
        event.currentTarget.select()
        openList()
      },
      onClick: openList,
    },
  }
}
