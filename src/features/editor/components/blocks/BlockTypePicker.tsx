import { Modal } from '@/components/ui'
import { BLOCK_TYPE_META, BLOCK_TYPE_ORDER } from '@/config/blockTypes'
import type { BlockType } from '@/types'
import { BlockTypeCard } from './BlockTypeCard'

export interface BlockTypePickerProps {
  open: boolean
  onClose: () => void
  onPick: (type: BlockType) => void
  /** When changing an existing block: its current type (exercises are kept). */
  current?: BlockType
}

/** Grid of block types. Used for '+ Añadir bloque' and 'Cambiar tipo de bloque'. */
export function BlockTypePicker({ open, onClose, onPick, current }: BlockTypePickerProps) {
  const changing = current !== undefined
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={changing ? 'Cambiar tipo de bloque' : '¿Qué tipo de bloque?'}
      description={
        changing ? 'Los ejercicios del bloque se mantienen.' : 'Elige cómo se va a hacer. Podrás cambiarlo después.'
      }
    >
      <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 lg:grid-cols-3">
        {BLOCK_TYPE_ORDER.map((type) => (
          <BlockTypeCard
            key={type}
            meta={BLOCK_TYPE_META[type]}
            selected={type === current}
            onSelect={() => {
              onPick(type)
              onClose()
            }}
          />
        ))}
      </div>
    </Modal>
  )
}
