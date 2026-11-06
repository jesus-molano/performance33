import { LayoutGrid, Minus, Plus } from 'lucide-react'
import { TV_LAUNCHER } from '@/features/shell/config'
import { stepSections } from '@/features/shell/utils/tvLauncher'

export interface TvSectionStepperProps {
  title: string
  value: number
  onChange: (sections: number) => void
}

const STEP_CLASSES =
  'inline-flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-fg/5 hover:text-fg disabled:pointer-events-none disabled:opacity-40'

/** A grid icon and '− 3 +': the sections of one screen (1-6), saved at once; the word is in its title and label, to keep the row short. */
export function TvSectionStepper({ title, value, onChange }: TvSectionStepperProps) {
  const fewer = stepSections(value, -1)
  const more = stepSections(value, 1)
  return (
    <div role="group" aria-label={TV_LAUNCHER.sectionsLabel(title)} title={TV_LAUNCHER.sections} className="flex shrink-0 items-center gap-1.5">
      <LayoutGrid size={14} aria-hidden className="text-fg-subtle" />
      <div className="flex items-center rounded-lg border border-line">
        <button type="button" aria-label={TV_LAUNCHER.fewerSections(title)} title={TV_LAUNCHER.fewerSections(title)} disabled={fewer === null} onClick={() => fewer !== null && onChange(fewer)} className={STEP_CLASSES}>
          <Minus size={14} aria-hidden />
        </button>
        <output aria-live="polite" className="w-6 text-center text-sm font-semibold tabular-nums text-fg">
          {value}
        </output>
        <button type="button" aria-label={TV_LAUNCHER.moreSections(title)} title={TV_LAUNCHER.moreSections(title)} disabled={more === null} onClick={() => more !== null && onChange(more)} className={STEP_CLASSES}>
          <Plus size={14} aria-hidden />
        </button>
      </div>
    </div>
  )
}
