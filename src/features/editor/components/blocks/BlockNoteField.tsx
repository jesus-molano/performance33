import { MessageSquarePlus } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { useDisclosure } from '../../../../hooks'
import { useAppActions } from '../../../../store'
import type { Block } from '../../../../types'
import { VisibleTextField } from '../common/VisibleTextField'

/** Optional client-visible note for the block ('Mantén técnica limpia'). Hidden behind a button when empty. */
export function BlockNoteField({ block }: { block: Block }) {
  const { updateBlock } = useAppActions()
  const { isOpen, open } = useDisclosure()

  if (!block.note && !isOpen) {
    return (
      <Button variant="ghost" size="sm" leftIcon={MessageSquarePlus} onClick={open} className="self-start">
        Nota para el cliente
      </Button>
    )
  }
  return (
    <VisibleTextField
      label="Nota del bloque"
      value={block.note}
      placeholder="Ej. Mantén la técnica limpia, sin prisa"
      autoFocus={isOpen && !block.note}
      onChange={(note) => updateBlock(block.id, { note })}
    />
  )
}
