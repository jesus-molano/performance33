import { useIsMobile } from '@/hooks'
import type { Day } from '@/types'
import { DayNamedTabs } from './DayNamedTabs'
import { DayNumberTabs } from './DayNumberTabs'

export interface DayTabsProps {
  days: Day[]
  selectedId: string | null
  /** False at the maximum number of days. */
  canAdd: boolean
  onSelect: (dayId: string) => void
  onMove: (dayId: string, toIndex: number) => void
  onAdd: () => void
}

/** Sticky day switcher, never scrolling sideways: numbers across the row on phones, named tabs above that. */
export function DayTabs(props: DayTabsProps) {
  const isMobile = useIsMobile()
  const Tabs = isMobile ? DayNumberTabs : DayNamedTabs
  return (
    <div className="sticky top-header z-20 -mx-4 bg-canvas/90 px-4 py-2 backdrop-blur md:-mx-0 md:px-0">
      <Tabs {...props} />
    </div>
  )
}
