import { ExerciseFilterFields } from '@/components/exercises/ExerciseFilterFields'
import { SegmentedControl } from '@/components/ui'
import type { ExerciseScope } from '@/lib/exerciseLibrary'
import type { LibraryBrowserApi } from '@/features/settings/hooks/useLibraryBrowser'

type ToolbarProps = Pick<LibraryBrowserApi, 'filters' | 'setFilter' | 'equipment' | 'customCount' | 'totalCount'>

export function LibraryToolbar({ filters, setFilter, equipment, customCount, totalCount }: ToolbarProps) {
  const scopeOptions: ReadonlyArray<{ value: ExerciseScope; label: string }> = [
    { value: 'all', label: `Todos (${totalCount})` },
    { value: 'custom', label: `Mis ejercicios (${customCount})` },
  ]
  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl ariaLabel="Qué ejercicios ver" options={scopeOptions} value={filters.scope} onChange={(scope) => setFilter('scope', scope)} className="self-start" />
      <ExerciseFilterFields filters={filters} setFilter={setFilter} equipment={equipment} />
    </div>
  )
}
