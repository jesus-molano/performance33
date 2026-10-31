import { removeById, updateById } from '@/lib/arrays'
import { newId } from '@/lib/ids'
import type { ClientNote } from '@/types'
import { getCurrentCoachId } from '@/store/uiStore'
import type { NoteActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'

export function createNoteSlice({ commit }: SliceContext): NoteActions {
  return {
    addNote: (clientId, text, opts = {}) => {
      const timestamp = new Date().toISOString()
      const note: ClientNote = {
        id: newId('note'),
        clientId,
        authorId: getCurrentCoachId() ?? '',
        text: text.trim(),
        pinned: !!opts.pinned,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      commit((d) => ({ ...d, notes: [...d.notes, note] }))
      return note.id
    },
    updateNote: (id, patch) =>
      commit(
        (d) => ({
          ...d,
          notes: updateById(d.notes, id, (n) => ({ ...n, ...patch, updatedAt: new Date().toISOString() })),
        }),
        'text' in patch ? groupKey('note', id, patch) : undefined,
      ),
    deleteNote: (id) => commit((d) => ({ ...d, notes: removeById(d.notes, id) })),
  }
}
