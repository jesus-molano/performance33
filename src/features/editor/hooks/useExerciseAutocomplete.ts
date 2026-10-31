import { useMemo, useState, type KeyboardEvent } from 'react'
import { exercisePatchFromLibrary } from '../../../lib/factories'
import { searchExercises, type ExerciseSearchResult } from '../../../lib/search'
import { useAppActions, useExerciseLibrary } from '../../../store'
import type { AnyLibraryExercise, ExerciseEntry } from '../../../types'
import { SEARCH_RESULT_LIMIT } from '../config'
import { namePatch } from '../utils'

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
  /** Last option: '+ Usar "<texto>" como ejercicio propio'. */
  showCustomOption: boolean
  highlighted: number
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  close: () => void
  choose: (index: number) => void
  highlight: (index: number) => void
}

/** Type-ahead over the exercise library (accent-insensitive, synonyms, typos) with full keyboard support. */
export function useExerciseAutocomplete({ entry, onDone, onExit }: AutocompleteOptions): ExerciseAutocomplete {
  const { updateExercise } = useAppActions()
  const library = useExerciseLibrary()
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const query = entry.name
  const results = useMemo(() => (open ? searchExercises(query, library, SEARCH_RESULT_LIMIT) : []), [open, query, library])
  const showCustomOption = query.trim() !== '' && entry.libraryId === null
  const optionCount = results.length + (showCustomOption ? 1 : 0)
  const isOpen = open && optionCount > 0

  const close = () => setOpen(false)
  const pick = (exercise: AnyLibraryExercise) => {
    updateExercise(entry.id, exercisePatchFromLibrary(exercise, entry))
    close()
    onDone()
  }
  const choose = (index: number) => {
    const result = results[index]
    if (result) pick(result.exercise)
    else {
      close()
      onDone()
    }
  }
  const move = (delta: 1 | -1) => {
    setOpen(true)
    setHighlighted((h) => (optionCount === 0 ? 0 : (h + delta + optionCount) % optionCount))
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
        if (isOpen) choose(highlighted)
        else if (query.trim()) onDone()
        else onExit()
        return
      case 'Tab':
        if (isOpen && highlighted < results.length && !event.shiftKey) {
          event.preventDefault()
          choose(highlighted)
        }
        return
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        if (isOpen) close()
        else onExit()
    }
  }

  const onChange = (value: string) => {
    updateExercise(entry.id, namePatch(entry, value))
    setOpen(value.trim() !== '')
    setHighlighted(0)
  }

  return { isOpen, results, showCustomOption, highlighted, onChange, onKeyDown, close, choose, highlight: setHighlighted }
}
