import { ExerciseLink } from '@/components/exercises/ExerciseLink'
import type { ExerciseEntry } from '@/types'
import { useEntryExerciseLink } from '@/features/editor/hooks/useEntryExerciseLink'

/** A routine's row keeps the library id for its link. If that exercise was deleted it searches the name instead. */
export function EntryExerciseLink({ entry }: { entry: Pick<ExerciseEntry, 'name' | 'libraryId'> }) {
  return <ExerciseLink name={entry.name} link={useEntryExerciseLink(entry.libraryId)} />
}
