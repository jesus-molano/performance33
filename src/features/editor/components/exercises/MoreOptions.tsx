import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useId } from 'react'
import { Switch } from '../../../../components/ui'
import { useDisclosure } from '../../../../hooks'
import { cn } from '../../../../lib/cn'
import { useAppActions } from '../../../../store'
import type { ExerciseEntry } from '../../../../types'
import type { WeekContext } from '../../types'
import { countOptionalValues } from '../../utils'
import { VisibleTextField } from '../common/VisibleTextField'
import { InternalNoteField } from './InternalNoteField'
import { LoadOptions } from './LoadOptions'
import { ProgressionStrip } from './ProgressionStrip'
import { TempoRestFields } from './TempoRestFields'

export interface MoreOptionsProps {
  entry: ExerciseEntry
  weeks: WeekContext
}

/** Optional fields kept out of the way so the default row stays minimal. */
export function MoreOptions({ entry, weeks }: MoreOptionsProps) {
  const { updateExercise } = useAppActions()
  const { isOpen, toggle } = useDisclosure()
  const panelId = useId()
  const filled = countOptionalValues(entry)

  return (
    <div className="rounded-xl border border-line">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-[15px] font-medium text-fg-muted hover:text-fg"
      >
        <SlidersHorizontal size={17} aria-hidden />
        <span className="flex-1">Más opciones</span>
        {filled > 0 && (
          <span className="rounded-full bg-fg/5 px-2 py-0.5 text-xs font-semibold text-fg-muted tabular">{filled}</span>
        )}
        <ChevronDown size={18} aria-hidden className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div id={panelId} className="flex animate-fade-in flex-col gap-4 border-t border-line p-3">
          <LoadOptions entry={entry} />
          <TempoRestFields entry={entry} />
          <Switch
            label="Por lado"
            description="Añade «c/lado» a las repeticiones"
            checked={entry.perSide}
            onChange={(perSide) => updateExercise(entry.id, { perSide })}
          />
          <VisibleTextField
            label="Indicación"
            value={entry.cue}
            placeholder="Ej. codos pegados, espalda neutra"
            onChange={(cue) => updateExercise(entry.id, { cue })}
          />
          <ProgressionStrip entry={entry} weeks={weeks} />
          <InternalNoteField entry={entry} />
        </div>
      )}
    </div>
  )
}
