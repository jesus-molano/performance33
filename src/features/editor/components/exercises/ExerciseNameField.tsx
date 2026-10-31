import { Search } from 'lucide-react'
import { useId } from 'react'
import { controlClasses } from '@/components/ui'
import { findExerciseById } from '@/lib/search'
import { breakUndoGroup, useExerciseLibrary } from '@/store'
import type { ExerciseEntry } from '@/types'
import { useExerciseAutocomplete } from '@/features/editor/hooks/useExerciseAutocomplete'
import { useFieldFocus } from '@/features/editor/hooks/useFieldFocus'
import { formatExerciseMeta } from '@/lib/exerciseLibrary'
import { ExerciseSuggestions } from './ExerciseSuggestions'
import { SaveToLibrary } from './SaveToLibrary'

export interface ExerciseNameFieldProps {
  entry: ExerciseEntry
  onDone: () => void
  onExit: () => void
}

/** Combobox: type → ↑/↓ → Enter picks and jumps to 'series'. Free text is always allowed. */
export function ExerciseNameField({ entry, onDone, onExit }: ExerciseNameFieldProps) {
  const id = useId()
  const listId = `${id}-list`
  const ref = useFieldFocus<HTMLInputElement>(entry.id, 'name')
  const ac = useExerciseAutocomplete({ entry, onDone, onExit })
  const library = useExerciseLibrary()
  const linked = findExerciseById(entry.libraryId, library)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        Ejercicio
      </label>
      <div className="relative">
        <Search size={18} aria-hidden className="pointer-events-none absolute top-3 left-3.5 text-fg-subtle" />
        <input
          ref={ref}
          id={id}
          role="combobox"
          aria-expanded={ac.isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={ac.isOpen ? `${listId}-${ac.highlighted}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Escribe para buscar: sentadilla, remo, plancha…"
          value={entry.name}
          onChange={(e) => ac.onChange(e.target.value)}
          onKeyDown={ac.onKeyDown}
          onBlur={() => {
            ac.close()
            breakUndoGroup()
          }}
          className={controlClasses(false, 'h-12 pl-10 text-base font-medium')}
        />
        {ac.isOpen && <ExerciseSuggestions id={listId} query={entry.name} ac={ac} />}
      </div>
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-fg-muted">
          {linked ? formatExerciseMeta(linked) : entry.name.trim() ? 'Ejercicio propio (texto libre)' : ''}
        </span>
        <SaveToLibrary entry={entry} />
      </div>
    </div>
  )
}
