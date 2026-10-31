import { Search } from 'lucide-react'
import { Input, SegmentedControl, Select } from '../../../components/ui'
import { EXERCISE_CATEGORIES } from '../../../data/exercises'
import type { LibraryBrowserApi } from '../hooks/useLibraryBrowser'
import type { CategoryFilter, LibraryScope } from '../utils/libraryFilter'

const CATEGORY_OPTIONS: ReadonlyArray<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'Todas las categorías' },
  ...EXERCISE_CATEGORIES.map((c) => ({ value: c, label: c })),
]

type ToolbarProps = Pick<LibraryBrowserApi, 'filters' | 'setFilter' | 'customCount' | 'totalCount'>

export function LibraryToolbar({ filters, setFilter, customCount, totalCount }: ToolbarProps) {
  const scopeOptions: ReadonlyArray<{ value: LibraryScope; label: string }> = [
    { value: 'custom', label: `Mis ejercicios (${customCount})` },
    { value: 'all', label: `Todos (${totalCount})` },
  ]
  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl ariaLabel="Qué ejercicios ver" options={scopeOptions} value={filters.scope} onChange={(scope) => setFilter('scope', scope)} className="self-start" />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <Input
          type="search"
          aria-label="Buscar ejercicio"
          placeholder="Buscar: sentadilla, remo, plancha…"
          leftIcon={Search}
          value={filters.query}
          onChange={(e) => setFilter('query', e.target.value)}
          nativeUndo
        />
        <Select aria-label="Categoría" options={CATEGORY_OPTIONS} value={filters.category} onChange={(category) => setFilter('category', category)} />
      </div>
    </div>
  )
}
