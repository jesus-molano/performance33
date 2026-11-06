// Block types for the web: the shared description of each type (shared/routine/blockTypes.ts) plus its icon.

import type { LucideIcon } from 'lucide-react'
import { BLOCK_TYPE_INFO, type BlockTypeInfo } from '@shared/routine/blockTypes.ts'
import type { BlockType } from '@/types'
import { BLOCK_TYPE_ICONS } from './blockTypeIcons'

export {
  BLOCK_PARAM_META,
  BLOCK_TYPE_INFO,
  BLOCK_TYPE_ORDER,
  INTERVAL_PRESETS,
  type BlockParamKey,
  type BlockTypeInfo,
} from '@shared/routine/blockTypes.ts'

export interface BlockTypeMeta extends BlockTypeInfo {
  icon: LucideIcon
}

export const BLOCK_TYPE_META = Object.fromEntries(
  (Object.keys(BLOCK_TYPE_INFO) as BlockType[]).map((type) => [type, { ...BLOCK_TYPE_INFO[type], icon: BLOCK_TYPE_ICONS[type] }]),
) as Record<BlockType, BlockTypeMeta>
