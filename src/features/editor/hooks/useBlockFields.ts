import { useMemo } from 'react'
import { useAppActions } from '@/store'
import type { BlockParams, BlockType } from '@/types'

export interface BlockFieldsApi {
  setTitle: (title: string) => void
  setText: (text: string) => void
  setNote: (note: string) => void
  setParams: (patch: Partial<BlockParams>) => void
  changeType: (type: BlockType) => void
}

/** Field edits of one block, bound to its id. */
export function useBlockFields(blockId: string): BlockFieldsApi {
  const { updateBlock, updateBlockParams, changeBlockType } = useAppActions()
  return useMemo(
    () => ({
      setTitle: (title: string) => updateBlock(blockId, { title }),
      setText: (text: string) => updateBlock(blockId, { text }),
      setNote: (note: string) => updateBlock(blockId, { note }),
      setParams: (patch: Partial<BlockParams>) => updateBlockParams(blockId, patch),
      changeType: (type: BlockType) => changeBlockType(blockId, type),
    }),
    [updateBlock, updateBlockParams, changeBlockType, blockId],
  )
}
