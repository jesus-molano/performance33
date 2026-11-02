import { Send } from 'lucide-react'
import { Button, Switch, Textarea } from '@/components/ui'
import { CLIENT_TEXT } from '@/features/clients/config'
import { useNoteComposer } from '@/features/clients/hooks/useNoteComposer'

/** New private note: text + 'Marcar como importante'. Ctrl/Cmd+Enter sends. */
export function NoteComposer({ clientId }: { clientId: string }) {
  const { text, setText, pinned, setPinned, canSubmit, submit, onKeyDown } = useNoteComposer(clientId)
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Textarea
        aria-label="Nueva nota interna"
        placeholder={CLIENT_TEXT.notePlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        nativeUndo
        rows={3}
        className="border-private-line bg-surface focus:border-private-icon focus:ring-private-icon/20"
      />
      <Switch checked={pinned} onChange={setPinned} label="Marcar como importante" description={CLIENT_TEXT.pinHelp} />
      <Button type="submit" variant="dark" leftIcon={Send} disabled={!canSubmit} className="self-end">
        Guardar nota
      </Button>
    </form>
  )
}
