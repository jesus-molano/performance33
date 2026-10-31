import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useComboboxSearch } from '@/features/display/hooks/useComboboxSearch'
import { filterClientOptions, type ClientOption } from '@/features/display/utils/clientOptions'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { TV_PICKER_TEXTS } from '@/features/display/config/tv'
import { ClientComboboxOption } from './ClientComboboxOption'

interface ClientComboboxProps {
  label: string
  options: ClientOption[]
  selectedId: string | null
  theme: DisplayThemeClasses
  onChange: (clientId: string | null) => void
  onOpenChange: (open: boolean) => void
  className?: string
}

const getKey = (option: ClientOption) => option.client.id
const getLabel = (option: ClientOption) => option.label

/** Searchable client picker for a TV column (first names only: it is shown on the gym TV). */
export function ClientCombobox({ label, options, selectedId, theme, onChange, onOpenChange, className }: ClientComboboxProps) {
  const selected = options.find((o) => o.client.id === selectedId) ?? null
  const { open, hasQuery, entries, activeIndex, setActiveIndex, select, optionId, rootRef, listRef, listId, inputProps } =
    useComboboxSearch({
      options,
      selected,
      getKey,
      getLabel,
      filter: filterClientOptions,
      onSelect: (option) => onChange(option?.client.id ?? null),
      onOpenChange,
    })

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <input
        {...inputProps}
        aria-label={label}
        placeholder={open ? TV_PICKER_TEXTS.searchPlaceholder : TV_PICKER_TEXTS.placeholder}
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full truncate rounded-full border border-current/20 bg-transparent pr-9 pl-4 text-base font-semibold select-text placeholder:font-normal placeholder:text-current/60 focus:outline-none focus-visible:border-current/50"
      />
      <ChevronDown
        size={18}
        aria-hidden
        className={cn('pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 opacity-70 transition-transform', open && 'rotate-180')}
      />
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className={cn('absolute inset-x-0 top-full z-20 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl p-1.5 shadow-pop', theme.overlay)}
        >
          {entries.map((option, index) => (
            <ClientComboboxOption
              key={option ? getKey(option) : 'none'}
              id={optionId(index)}
              index={index}
              option={option}
              active={index === activeIndex}
              selected={option ? getKey(option) === selectedId : !selectedId}
              onPick={() => select(option)}
              onHover={() => setActiveIndex(index)}
            />
          ))}
          {hasQuery && entries.length === 1 && (
            <li role="presentation" className="px-3 py-2 text-sm opacity-70">
              {TV_PICKER_TEXTS.noResults}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
