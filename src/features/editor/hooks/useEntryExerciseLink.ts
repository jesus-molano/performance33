import { useExerciseLibraryLink } from '@/store'

/** The link of a routine row's library exercise; null if it has none or that exercise was deleted (then it searches the name). */
export const useEntryExerciseLink = (libraryId: string | null | undefined): string | null => useExerciseLibraryLink(libraryId ?? null)
