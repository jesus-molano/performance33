import { useMemo, useState, type FormEvent } from 'react'
import { useToast } from '@/hooks'
import { findSimilarExercises } from '@/lib/search'
import { useAppActions, useExerciseLibrary } from '@/store'
import type { LibraryExercise, MuscleGroup } from '@/types'
import { isValidLinkText, toggleMuscle, toLibraryExerciseInput, toExerciseFormValues, withMainMuscle, type ExerciseFormValues } from '@/features/settings/utils/exerciseForm'

export interface ExerciseFormApi {
  isEdit: boolean
  values: ExerciseFormValues
  setField: <K extends keyof ExerciseFormValues>(key: K, value: ExerciseFormValues[K]) => void
  setMainMuscle: (muscle: MuscleGroup) => void
  toggleSecondaryMuscle: (muscle: MuscleGroup) => void
  nameError: string | undefined
  linkError: string | undefined
  /** Existing exercises with a very similar name (to avoid duplicates). */
  similar: LibraryExercise[]
  submit: (event: FormEvent) => void
}

/** Add / edit a library exercise. */
export function useExerciseForm(exercise: LibraryExercise | null, onDone: () => void): ExerciseFormApi {
  const library = useExerciseLibrary()
  const { addLibraryExercise, updateLibraryExercise } = useAppActions()
  const { toast } = useToast()
  const [values, setValues] = useState(() => toExerciseFormValues(exercise))
  const [submitted, setSubmitted] = useState(false)

  const similar = useMemo(
    () => (values.name.trim() ? findSimilarExercises(values.name, library).filter((e) => e.id !== exercise?.id) : []),
    [values.name, library, exercise?.id],
  )
  const invalidName = !values.name.trim()
  const invalidLink = !isValidLinkText(values.link)

  const setField: ExerciseFormApi['setField'] = (key, value) => setValues((v) => ({ ...v, [key]: value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalidName || invalidLink) return
    const input = toLibraryExerciseInput(values)
    if (exercise) updateLibraryExercise(exercise.id, input)
    else addLibraryExercise(input)
    toast({ message: exercise ? 'Ejercicio actualizado' : `«${input.name}» añadido a la biblioteca`, tone: 'success' })
    onDone()
  }

  return {
    isEdit: exercise !== null,
    values,
    setField,
    setMainMuscle: (muscle) => setValues((v) => withMainMuscle(v, muscle)),
    toggleSecondaryMuscle: (muscle) => setValues((v) => ({ ...v, secondaryMuscles: toggleMuscle(v.secondaryMuscles, muscle) })),
    nameError: submitted && invalidName ? 'Escribe el nombre del ejercicio.' : undefined,
    linkError: submitted && invalidLink ? 'Escribe una dirección web completa, por ejemplo https://youtu.be/abc.' : undefined,
    similar,
    submit,
  }
}
