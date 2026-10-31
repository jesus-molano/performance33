import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import { VisibleTextField } from '@/features/editor/components/common/VisibleTextField'

export interface BlockNoteFieldProps {
  note: string
  onChange: (note: string) => void
}

/** Optional client-visible note for the block ('Mantén técnica limpia'). Hidden behind a button when empty. */
export function BlockNoteField({ note, onChange }: BlockNoteFieldProps) {
  const { isOpen, open } = useDisclosure()

  if (!note && !isOpen) {
    return (
      <Button variant="ghost" size="sm" leftIcon={MessageSquarePlus} onClick={open} className="self-start">
        Nota para el cliente
      </Button>
    )
  }
  return (
    <VisibleTextField
      label="Nota del bloque"
      value={note}
      placeholder="Ej. Mantén la técnica limpia, sin prisa"
      autoFocus={isOpen && !note}
      onChange={onChange}
    />
  )
}
