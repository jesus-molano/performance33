import { Chip } from '@/components/ui'
import { SECONDARY_MUSCLE_CHOICES } from '@/config/exerciseTags'
import type { MuscleGroup } from '@/types'

export interface SecondaryMusclesFieldProps {
  /** The main muscle is not offered here. */
  main: MuscleGroup
  selected: readonly MuscleGroup[]
  onToggle: (muscle: MuscleGroup) => void
}

export function SecondaryMusclesField({ main, selected, onToggle }: SecondaryMusclesFieldProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-fg">Otros músculos que trabaja (opcional)</legend>
      <div className="flex flex-wrap gap-2">
        {SECONDARY_MUSCLE_CHOICES.filter((muscle) => muscle !== main).map((muscle) => (
          <Chip key={muscle} active={selected.includes(muscle)} onClick={() => onToggle(muscle)}>
            {muscle}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}
