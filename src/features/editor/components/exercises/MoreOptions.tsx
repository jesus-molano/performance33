import { ChevronDown, Lock, SlidersHorizontal } from 'lucide-react'
import { useId } from 'react'
import { PrivacyLabel, Switch } from '@/components/ui'
import { EXERCISE_CUE_MAX_LENGTH } from '@/config/capacity'
import { useDisclosure } from '@/hooks'
import { cn } from '@/lib/cn'
import type { ExerciseEntry } from '@/types'
import type { ExerciseFieldsApi } from '@/features/editor/hooks/useExerciseFields'
import { countOptionalValues } from '@/features/editor/utils'
import { VisibleTextField } from '@/features/editor/components/common/VisibleTextField'
import { InternalNoteField } from './InternalNoteField'
import { LoadOptions } from './LoadOptions'
import { ProgressionStrip } from './ProgressionStrip'
import { TempoRestFields } from './TempoRestFields'

export interface MoreOptionsProps {
  entry: ExerciseEntry
  fields: ExerciseFieldsApi
}

/**
 * Optional fields kept out of the way so the default row stays minimal, split into what the client
 * sees on the TV and what only coaches see (amber + lock).
 */
export function MoreOptions({ entry, fields }: MoreOptionsProps) {
  const { isOpen, toggle } = useDisclosure()
  const panelId = useId()
  const filled = countOptionalValues(entry)
  const hasPrivateNote = entry.internalNote.trim() !== ''

  return (
    <div className="rounded-xl border border-line">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-md font-medium text-fg-muted hover:text-fg"
      >
        <SlidersHorizontal size={17} aria-hidden />
        <span className="flex-1">Más opciones</span>
        {hasPrivateNote && <Lock size={15} role="img" aria-label="Tiene nota interna" className="text-private-icon" />}
        {filled > 0 && (
          <span className="rounded-full bg-fg/5 px-2 py-0.5 text-xs font-semibold text-fg-muted tabular">{filled}</span>
        )}
        <ChevronDown size={18} aria-hidden className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div id={panelId} className="flex animate-fade-in flex-col gap-4 border-t border-line p-3">
          <PrivacyLabel kind="visible" />
          <LoadOptions entry={entry} fields={fields} />
          <TempoRestFields entry={entry} fields={fields} />
          <Switch
            label="Por lado"
            description="Añade «c/lado» a las repeticiones"
            checked={entry.perSide}
            onChange={(perSide) => fields.setField('perSide', perSide)}
          />
          <VisibleTextField
            label="Indicación"
            value={entry.cue}
            placeholder="Ej. codos pegados, espalda neutra"
            maxLength={EXERCISE_CUE_MAX_LENGTH}
            onChange={(cue) => fields.setField('cue', cue)}
          />
          <ProgressionStrip entry={entry} />
          <div className="mt-1 flex flex-col gap-3 border-t-2 border-dashed border-private-line pt-4">
            <InternalNoteField value={entry.internalNote} onChange={(note) => fields.setField('internalNote', note)} />
          </div>
        </div>
      )}
    </div>
  )
}
