import type { LucideIcon } from 'lucide-react'
import { Dumbbell, Flame, Hourglass, Leaf, Link2, Repeat, Timer, TimerReset, Zap } from 'lucide-react'
import type { BlockType } from '@/types'

/** Icon of each block type, web only (lucide-react does not run in the members' app). */
export const BLOCK_TYPE_ICONS: Record<BlockType, LucideIcon> = {
  normal: Dumbbell,
  superset: Link2,
  circuit: Repeat,
  emom: Timer,
  amrap: Hourglass,
  tabata: Zap,
  fortime: TimerReset,
  warmup: Flame,
  cooldown: Leaf,
}
