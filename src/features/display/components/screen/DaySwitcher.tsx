import { ChevronLeft, ChevronRight } from 'lucide-react'
import { OverlayButton } from './OverlayButton'

interface DaySwitcherProps {
  dayNumber: number
  dayCount: number
  dayTitle: string
  onPrev: () => void
  onNext: () => void
}

/** ‹ Día 2 · Pierna › (also ←/→ on the keyboard). */
export function DaySwitcher({ dayNumber, dayCount, dayTitle, onPrev, onNext }: DaySwitcherProps) {
  const single = dayCount <= 1
  return (
    <>
      <OverlayButton label="Día anterior (←)" icon={ChevronLeft} onClick={onPrev} disabled={single} />
      <span className="tabular min-w-24 px-1 text-center text-base leading-tight font-semibold">
        {dayTitle || `Día ${dayNumber}`}
        <span className="block text-xs font-normal opacity-70">
          {dayNumber} de {dayCount}
        </span>
      </span>
      <OverlayButton label="Día siguiente (→)" icon={ChevronRight} onClick={onNext} disabled={single} />
    </>
  )
}
