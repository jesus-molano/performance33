import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useToast } from '@/hooks'
import { useAppActions } from '@/store'

export interface NoteComposerApi {
  text: string
  setText: (text: string) => void
  pinned: boolean
  setPinned: (pinned: boolean) => void
  canSubmit: boolean
  submit: (event?: FormEvent) => void
  /** Ctrl/Cmd + Enter sends the note. */
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}

/** New private note for a client, signed by the current coach. */
export function useNoteComposer(clientId: string): NoteComposerApi {
  const { addNote } = useAppActions()
  const { toast } = useToast()
  const [text, setText] = useState('')
  const [pinned, setPinned] = useState(false)
  const canSubmit = text.trim().length > 0

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!canSubmit) return
    addNote(clientId, text.trim(), { pinned })
    toast({ message: pinned ? 'Alerta fijada' : 'Nota guardada', tone: 'success' })
    setText('')
    setPinned(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) submit()
  }

  return { text, setText, pinned, setPinned, canSubmit, submit, onKeyDown }
}
