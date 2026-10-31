import { useCallback } from 'react'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useToast } from '../../../hooks/useToast'
import { formatDateTime } from '../../../lib/dates'
import { breakUndoGroup, useAppActions, useCoach } from '../../../store'
import type { ClientNote, Coach } from '../../../types'

export interface NoteItemApi {
  author: Coach | null
  authorName: string
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
    author,
    authorName: author?.name ?? 'Monitor eliminado',
    dateLabel: formatDateTime(note.createdAt),
    isEditing: isOpen,
    startEditing: open,
    changeText: (text) => updateNote(note.id, { text }),
    finishEditing,
    togglePin: () => updateNote(note.id, { pinned: !note.pinned }),
    remove,
  }
}
