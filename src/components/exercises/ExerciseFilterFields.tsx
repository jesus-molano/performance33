import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { Input, Select } from '@/components/ui'
import { EXERCISE_CATEGORIES } from '@/config/exerciseCategories'
import type { ExerciseBrowserApi } from '@/hooks'
import { cn } from '@/lib/cn'
import { ALL_EQUIPMENT, type ExerciseCategoryFilter } from '@/lib/exerciseLibrary'

const CATEGORY_OPTIONS: ReadonlyArray<{ value: ExerciseCategoryFilter; label: string }> = [
  { value: 'all', label: 'Todas las categorías' },
  ...EXERCISE_CATEGORIES.map((c) => ({ value: c, label: c })),
]

export interface ExerciseFilterFieldsProps extends Pick<ExerciseBrowserApi, 'filters' | 'setFilter'> {
  /** Materials to filter by; leave it out to hide that filter. */
  equipment?: string[]
}

/** Search box + category and, optionally, material. */
export function ExerciseFilterFields({ filters, setFilter, equipment }: ExerciseFilterFieldsProps) {
  const equipmentOptions = useMemo(
    () => equipment && [{ value: ALL_EQUIPMENT, label: 'Todo el material' }, ...equipment.map((e) => ({ value: e, label: e }))],
    [equipment],
  )
  return (
    <div className={cn('grid gap-3', equipmentOptions ? 'sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_200px]' : 'sm:grid-cols-[minmax(0,1fr)_200px]')}>
      <Input
        type="search"
        aria-label="Buscar ejercicio"
        placeholder="Buscar: sentadilla, remo, plancha…"
        leftIcon={Search}
        value={filters.query}
        onChange={(e) => setFilter('query', e.target.value)}
        nativeUndo
        containerClassName={cn(equipmentOptions && 'sm:col-span-2 lg:col-span-1')}
      />
      <Select aria-label="Categoría" options={CATEGORY_OPTIONS} value={filters.category} onChange={(category) => setFilter('category', category)} />
      {equipmentOptions && (
        <Select aria-label="Material" options={equipmentOptions} value={filters.equipment} onChange={(value) => setFilter('equipment', value)} />
      )}
    </div>
  )
}
