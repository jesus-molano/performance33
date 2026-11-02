import { ExerciseLink } from '@/components/exercises/ExerciseLink'
import { useExerciseLibraryLink } from '@/store'
import type { ExerciseEntry } from '@/types'

/** A routine's row keeps the library id for its link. If that exercise was deleted it searches the name instead. */
export function EntryExerciseLink({ entry }: { entry: Pick<ExerciseEntry, 'name' | 'libraryId'> }) {
  const link = useExerciseLibraryLink(entry.libraryId)
  return <ExerciseLink name={entry.name} link={link} />
}
