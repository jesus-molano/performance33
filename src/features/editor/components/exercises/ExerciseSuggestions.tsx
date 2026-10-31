import { Plus } from 'lucide-react'
import { Badge } from '../../../../components/ui'
import { cn } from '../../../../lib/cn'
import type { ExerciseAutocomplete } from '../../hooks/useExerciseAutocomplete'
import { libraryMeta } from '../../utils'

export interface ExerciseSuggestionsProps {
  id: string
  query: string
  ac: ExerciseAutocomplete
}

const optionClasses = (active: boolean) =>
  cn('flex min-h-12 w-full cursor-pointer flex-col justify-center rounded-lg px-3 py-1.5', active ? 'bg-brand-soft' : 'hover:bg-fg/5')

/** Listbox under the name field. mousedown is prevented so the input keeps focus while clicking. */
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
        <li
          key={exercise.id}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === ac.highlighted}
          onMouseEnter={() => ac.highlight(index)}
          onClick={() => ac.choose(index)}
          className={optionClasses(index === ac.highlighted)}
        >
          <span className="flex items-center gap-2 text-[15px] font-medium text-fg">
            {exercise.name}
            {matchedAlias && <span className="text-sm font-normal text-fg-subtle">· {matchedAlias}</span>}
            {exercise.custom && (
              <Badge size="sm" tone="neutral">
                Propio
              </Badge>
            )}
          </span>
          <span className="text-xs text-fg-muted">{libraryMeta(exercise)}</span>
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
          <span className="text-[15px]">
            Usar «<span className="font-semibold">{query.trim()}</span>» como ejercicio propio
          </span>
        </li>
      )}
    </ul>
  )
}
