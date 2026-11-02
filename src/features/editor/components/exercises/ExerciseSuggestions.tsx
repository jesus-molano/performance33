import { LayoutList, Plus } from 'lucide-react'
import { ExerciseSearchLink } from '@/components/exercises/ExerciseSearchLink'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ExerciseAutocomplete } from '@/features/editor/hooks/useExerciseAutocomplete'
import { formatExerciseMeta } from '@/lib/exerciseLibrary'

export interface ExerciseSuggestionsProps {
  id: string
  query: string
  ac: ExerciseAutocomplete
}

const optionClasses = (active: boolean) =>
  cn('flex min-h-12 w-full cursor-pointer flex-col justify-center rounded-lg px-3 py-1.5', active ? 'bg-brand-soft' : 'hover:bg-fg/5')

/** Listbox under the name field, ending in 'Ver todos los ejercicios'. mousedown is prevented so the input keeps focus while clicking. */
export function ExerciseSuggestions({ id, query, ac }: ExerciseSuggestionsProps) {
  const customIndex = ac.results.length
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Ejercicios de la biblioteca"
      onMouseDown={(e) => e.preventDefault()}
      className="absolute top-full right-0 left-0 z-30 mt-1 max-h-80 animate-pop-in overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-pop"
    >
      {ac.results.map(({ exercise, matchedAlias }, index) => (
        <li key={exercise.id} role="none" onMouseEnter={() => ac.highlight(index)} className="flex items-center gap-1">
          <div id={`${id}-${index}`} role="option" aria-selected={index === ac.highlighted} onClick={() => ac.choose(index)} className={cn(optionClasses(index === ac.highlighted), 'min-w-0')}>
            <span className="flex items-center gap-2 text-md font-medium text-fg">
              <span className="truncate">{exercise.name}</span>
              {matchedAlias && <span className="truncate text-sm font-normal text-fg-subtle">· {matchedAlias}</span>}
              {exercise.custom && (
                <Badge size="sm" tone="neutral">
                  Propio
                </Badge>
              )}
            </span>
            <span className="truncate text-xs text-fg-muted">{formatExerciseMeta(exercise)}</span>
          </div>
          <ExerciseSearchLink name={exercise.name} />
        </li>
      ))}
      {ac.showCustomOption && (
        <li
          id={`${id}-${customIndex}`}
          role="option"
          aria-selected={customIndex === ac.highlighted}
          onMouseEnter={() => ac.highlight(customIndex)}
          onClick={() => ac.choose(customIndex)}
          className={cn(optionClasses(customIndex === ac.highlighted), 'flex-row items-center justify-start gap-2 text-brand-strong')}
        >
          <Plus size={16} aria-hidden />
          <span className="text-md">
            Usar «<span className="font-semibold">{query.trim()}</span>» como ejercicio propio
          </span>
        </li>
      )}
      <li
        id={`${id}-${ac.browseIndex}`}
        role="option"
        aria-selected={ac.browseIndex === ac.highlighted}
        onMouseEnter={() => ac.highlight(ac.browseIndex)}
        onClick={() => ac.choose(ac.browseIndex)}
        className={cn(
          optionClasses(ac.browseIndex === ac.highlighted),
          'sticky -bottom-1 flex-row items-center justify-start gap-2 font-medium text-fg',
          ac.browseIndex !== ac.highlighted && 'bg-surface hover:bg-canvas',
        )}
      >
        <LayoutList size={16} aria-hidden />
        <span className="text-md">Ver todos los ejercicios</span>
      </li>
    </ul>
  )
}
