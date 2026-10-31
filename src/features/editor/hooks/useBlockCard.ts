import { useDisclosure, type Disclosure } from '@/hooks'
import type { Block, Day } from '@/types'
import { useEditorUi } from '@/features/editor/store/editorUiStore'
import { useBlockActions, type BlockActionsApi } from './useBlockActions'
import { useBlockFields, type BlockFieldsApi } from './useBlockFields'
import { useEditorContext } from './useEditorContext'

export interface BlockCardApi {
  collapsed: boolean
  toggle: () => void
  fields: BlockFieldsApi
  actions: BlockActionsApi
  typePicker: Disclosure
  copyModal: Disclosure
  /** Days a block can be copied to (every day but its own). */
  otherDays: Day[]
}

/** Everything a block card needs: collapse state, field edits, '⋯' actions and its two dialogs. */
export function useBlockCard(block: Block, blockIndex: number, day: Day): BlockCardApi {
  const { days } = useEditorContext()
  const collapsed = useEditorUi((s) => !!s.collapsedBlocks[block.id])
  const toggleBlock = useEditorUi((s) => s.toggleBlock)
  const typePicker = useDisclosure()
  const copyModal = useDisclosure()
  const fields = useBlockFields(block.id)
  const actions = useBlockActions({
    blockId: block.id,
    dayId: day.id,
    blockIndex,
    blockCount: day.blocks.length,
    dayCount: days.length,
    onChangeType: typePicker.open,
    onCopyToDay: copyModal.open,
  })
  return {
    collapsed,
    toggle: () => toggleBlock(block.id),
    fields,
    actions,
    typePicker,
    copyModal,
    otherDays: days.filter((d) => d.id !== day.id),
  }
}
