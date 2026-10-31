import { useCallback } from 'react'
import { useDisclosure, useToast } from '@/hooks'
import { UNKNOWN_AUTHOR_COLOR } from '@/config/colors'
import { formatDateTime } from '@/lib/dates'
import { breakUndoGroup, useAppActions, useCoach } from '@/store'
import type { ClientNote } from '@/types'

export interface NoteItemApi {
  authorName: string
  authorColor: string
  dateLabel: string
  isEditing: boolean
  startEditing: () => void
  /** Store-bound: every keystroke autosaves (grouped into one undo step). */
  changeText: (text: string) => void
  finishEditing: () => void
  togglePin: () => void
  remove: () => void
}

export function useNoteItem(note: ClientNote): NoteItemApi {
  const author = useCoach(note.authorId)
  const { updateNote, deleteNote } = useAppActions()
  const { toastUndo } = useToast()
  const { isOpen, open, close } = useDisclosure()

  const remove = useCallback(() => {
    deleteNote(note.id)
    toastUndo('Nota eliminada')
  }, [deleteNote, note.id, toastUndo])

  const finishEditing = useCallback(() => {
    breakUndoGroup()
    close()
    if (!note.text.trim()) remove()
  }, [close, note.text, remove])

  return {
    authorName: author?.name ?? 'Monitor eliminado',
    authorColor: author?.color ?? UNKNOWN_AUTHOR_COLOR,
    dateLabel: formatDateTime(note.createdAt),
    isEditing: isOpen,
    startEditing: open,
    changeText: (text) => updateNote(note.id, { text }),
    finishEditing,
    togglePin: () => updateNote(note.id, { pinned: !note.pinned }),
    remove,
  }
}
