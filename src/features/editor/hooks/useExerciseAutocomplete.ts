import { useMemo, useState, type KeyboardEvent } from 'react'
import { useDisclosure } from '@/hooks'
import { exercisePatchFromLibrary } from '@/lib/factories'
import { searchExercises, type ExerciseSearchResult } from '@/lib/search'
import { useAppActions, useExerciseLibrary } from '@/store'
import type { LibraryExercise, ExerciseEntry } from '@/types'
import { NO_HIGHLIGHT, SEARCH_RESULT_LIMIT } from '@/features/editor/config'
import { moveHighlight, namePatch } from '@/features/editor/utils'

export interface AutocompleteOptions {
  entry: ExerciseEntry
  /** After picking a match or confirming free text: move on to the next field. */
  onDone: () => void
  /** Escape with the list already closed (or Enter on an empty name). */
  onExit: () => void
}

export interface ExerciseAutocomplete {
  isOpen: boolean
  results: ExerciseSearchResult[]
  /** Option after the results: '+ Usar "<texto>" como ejercicio propio'. */
  showCustomOption: boolean
  /** Last option: 'Ver todos los ejercicios'. */
  browseIndex: number
  highlighted: number
  onChange: (value: string) => void
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  close: () => void
  choose: (index: number) => void
  highlight: (index: number) => void
  pickerOpen: boolean
  closePicker: () => void
  pick: (exercise: LibraryExercise) => void
}

/** Type-ahead over the exercise library (accent-insensitive, synonyms, typos) with full keyboard support. */
export function useExerciseAutocomplete({ entry, onDone, onExit }: AutocompleteOptions): ExerciseAutocomplete {
  const { updateExercise } = useAppActions()
  const library = useExerciseLibrary()
  const picker = useDisclosure()
  const [isOpen, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const query = entry.name
  const results = useMemo(() => (isOpen ? searchExercises(query, library, SEARCH_RESULT_LIMIT) : []), [isOpen, query, library])
  const showCustomOption = query.trim() !== '' && entry.libraryId === null
  const browseIndex = results.length + (showCustomOption ? 1 : 0)
  const isHighlighting = highlighted !== NO_HIGHLIGHT

  const close = () => setOpen(false)
  const pick = (exercise: LibraryExercise) => {
    updateExercise(entry.id, exercisePatchFromLibrary(exercise, entry))
    close()
    picker.close()
    onDone()
  }
  const choose = (index: number) => {
    const result = results[index]
    close()
    if (result) pick(result.exercise)
    else if (index === browseIndex) picker.open()
    else onDone()
  }
  const move = (delta: 1 | -1) => {
    setOpen(true)
    setHighlighted((h) => moveHighlight(h, delta, browseIndex + 1))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault()
        move(event.key === 'ArrowDown' ? 1 : -1)
        return
      case 'Enter':
        event.preventDefault()
        if (isOpen && isHighlighting) choose(highlighted)
        else if (query.trim()) onDone()
        else onExit()
        return
      case 'Tab':
        if (isOpen && isHighlighting && highlighted < results.length && !event.shiftKey) {
          event.preventDefault()
          choose(highlighted)
        }
        return
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        close()
        if (!isOpen || !isHighlighting) onExit()
    }
  }

  const onChange = (value: string) => {
    updateExercise(entry.id, namePatch(entry, value))
    setOpen(value.trim() !== '')
    setHighlighted(0)
  }

  /** An empty field offers 'Ver todos' right away, without taking over Enter or Escape. */
  const onFocus = () => {
    if (query.trim()) return
    setOpen(true)
    setHighlighted(NO_HIGHLIGHT)
  }

  return {
    isOpen,
    results,
    showCustomOption,
    browseIndex,
    highlighted,
    onChange,
    onFocus,
    onKeyDown,
    close,
    choose,
    highlight: setHighlighted,
    pickerOpen: picker.isOpen,
    closePicker: picker.close,
    pick,
  }
}
