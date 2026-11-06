// Undoing a section change without overwriting someone else's: only the sections that still show what it wrote.

import type { SectionChange, SectionMap, SectionWrite } from '@/features/screens/types'
import { contentOf, sameContent, sectionId } from './sections'

export interface UndoPlan {
  writes: SectionWrite[]
  /** Sections changed again since (another coach, another window): left as they are. */
  skipped: number
}

export function planUndo(sections: SectionMap, change: Pick<SectionChange, 'previous' | 'written'>): UndoPlan {
  const untouched = new Set(
    change.written.filter((write) => sameContent(contentOf(sections, write.ref), write.content)).map((write) => sectionId(write.ref)),
  )
  const writes = change.previous.filter((write) => untouched.has(sectionId(write.ref)))
  return { writes, skipped: change.previous.length - writes.length }
}
