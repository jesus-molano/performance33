import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { Input, Select } from '@/components/ui'
import { EXERCISE_TYPE_OPTIONS, MUSCLE_OPTIONS } from '@/config/exerciseTags'
import type { ExerciseBrowserApi } from '@/hooks'
import { cn } from '@/lib/cn'
import { ALL_EQUIPMENT, type ExerciseTypeFilter, type MuscleFilter } from '@/lib/exerciseLibrary'

const MUSCLE_FILTER_OPTIONS: ReadonlyArray<{ value: MuscleFilter; label: string }> = [{ value: 'all', label: 'Músculo: todo' }, ...MUSCLE_OPTIONS]
const TYPE_FILTER_OPTIONS: ReadonlyArray<{ value: ExerciseTypeFilter; label: string }> = [{ value: 'all', label: 'Tipo: todo' }, ...EXERCISE_TYPE_OPTIONS]

/** Narrow enough for two side by side on a phone. */
const COMPACT_SELECT = 'pl-3 pr-8!'

export interface ExerciseFilterFieldsProps extends Pick<ExerciseBrowserApi, 'filters' | 'setFilter'> {
  /** Materials to filter by; leave it out to hide that filter. */
  equipment?: string[]
}

/** Search box + muscle and type side by side and, optionally, material. */
export function ExerciseFilterFields({ filters, setFilter, equipment }: ExerciseFilterFieldsProps) {
  const equipmentOptions = useMemo(
    () => equipment && [{ value: ALL_EQUIPMENT, label: 'Material: todo' }, ...equipment.map((e) => ({ value: e, label: e }))],
    [equipment],
  )
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 sm:gap-3',
        equipmentOptions ? 'sm:grid-cols-3 lg:grid-cols-[minmax(0,1fr)_175px_175px_175px]' : 'sm:grid-cols-[minmax(0,1fr)_175px_175px]',
      )}
    >
      <Input
        type="search"
        aria-label="Buscar ejercicio"
        placeholder="Buscar: sentadilla, remo, pecho…"
        leftIcon={Search}
        value={filters.query}
        onChange={(e) => setFilter('query', e.target.value)}
        nativeUndo
        containerClassName={cn('col-span-2', equipmentOptions ? 'sm:col-span-3 lg:col-span-1' : 'sm:col-span-1')}
      />
      <Select aria-label="Músculo" className={COMPACT_SELECT} options={MUSCLE_FILTER_OPTIONS} value={filters.muscle} onChange={(muscle) => setFilter('muscle', muscle)} />
      <Select aria-label="Tipo" className={COMPACT_SELECT} options={TYPE_FILTER_OPTIONS} value={filters.type} onChange={(type) => setFilter('type', type)} />
      {equipmentOptions && (
        <Select
          aria-label="Material"
          className={COMPACT_SELECT}
          containerClassName="col-span-2 sm:col-span-1"
          options={equipmentOptions}
          value={filters.equipment}
          onChange={(value) => setFilter('equipment', value)}
        />
      )}
    </div>
  )
}
