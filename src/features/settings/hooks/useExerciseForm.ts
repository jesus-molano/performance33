import { useMemo, useState, type FormEvent } from 'react'
import { useToast } from '../../../hooks/useToast'
import { findSimilarExercises } from '../../../lib/search'
import { useAppActions, useExerciseLibrary } from '../../../store'
import type { AnyLibraryExercise } from '../../../types'
import { toCustomExerciseInput, toExerciseFormValues, type ExerciseFormValues } from '../utils/exerciseForm'

export interface ExerciseFormApi {
  isEdit: boolean
  values: ExerciseFormValues
  setField: <K extends keyof ExerciseFormValues>(key: K, value: ExerciseFormValues[K]) => void
  nameError: string | undefined
  /** Existing exercises with a very similar name (to avoid duplicates). */
  similar: AnyLibraryExercise[]
  submit: (event: FormEvent) => void
}

/** Add / edit a custom library exercise. */
export function useExerciseForm(exercise: AnyLibraryExercise | null, onDone: () => void): ExerciseFormApi {
  const library = useExerciseLibrary()
  const { addCustomExercise, updateCustomExercise } = useAppActions()
  const { toast } = useToast()
  const [values, setValues] = useState(() => toExerciseFormValues(exercise))
  const [submitted, setSubmitted] = useState(false)

  const similar = useMemo(
    () => (values.name.trim() ? findSimilarExercises(values.name, library).filter((e) => e.id !== exercise?.id) : []),
    [values.name, library, exercise?.id],
  )
  const invalid = !values.name.trim()

  const setField: ExerciseFormApi['setField'] = (key, value) => setValues((v) => ({ ...v, [key]: value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalid) return
    const input = toCustomExerciseInput(values)
    if (exercise) updateCustomExercise(exercise.id, input)
    else addCustomExercise(input)
    toast({ message: exercise ? 'Ejercicio actualizado' : `«${input.name}» añadido a la biblioteca`, tone: 'success' })
    onDone()
  }

  return {
    isEdit: exercise !== null,
    values,
    setField,
    nameError: submitted && invalid ? 'Escribe el nombre del ejercicio.' : undefined,
    similar,
    submit,
  }
}
