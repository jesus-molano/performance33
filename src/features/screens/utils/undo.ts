// Undoing a section change without overwriting someone else's: only the sections that still show what it wrote, and
// never someone who meanwhile shows somewhere else (a person is on one screen at a time).

import type { SectionChange, SectionMap, SectionWrite } from '@/features/screens/types'
import { contentOf, findClientSections, sameContent, sectionId } from './sections'

export interface UndoPlan {
  writes: SectionWrite[]
  /** Sections changed again since (another coach, another window), or whose person shows elsewhere now: left as they are. */
  skipped: number
}

export function planUndo(sections: SectionMap, change: Pick<SectionChange, 'previous' | 'written'>): UndoPlan {
  const untouched = new Set(
    change.written.filter((write) => sameContent(contentOf(sections, write.ref), write.content)).map((write) => sectionId(write.ref)),
  )
  const shownElsewhere = (clientId: string | null) =>
    clientId !== null && findClientSections(sections, clientId).some((ref) => !untouched.has(sectionId(ref)))
  const writes = change.previous.filter((write) => untouched.has(sectionId(write.ref)) && !shownElsewhere(write.content.clientId))
  return { writes, skipped: change.previous.length - writes.length }
}
