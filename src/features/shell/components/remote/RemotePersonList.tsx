import { Check, Search } from 'lucide-react'
import { Input } from '@/components/ui'
import { cn } from '@/lib/cn'
import { REMOTE_COPY, type RemotePerson } from '@/features/screens'
import { useRemotePeopleSearch } from '@/features/shell/hooks/useRemotePeopleSearch'

export interface RemotePersonListProps {
  people: readonly RemotePerson[]
  /** Who the section shows now. */
  currentId: string | null
  places: ReadonlyMap<string, string>
  onPick: (person: RemotePerson) => void
}

/** 'Cambiar persona': a search over the people with a routine, each with where they show now. */
export function RemotePersonList({ people, currentId, places, onPick }: RemotePersonListProps) {
  const search = useRemotePeopleSearch(people)
  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        aria-label={REMOTE_COPY.searchLabel}
        placeholder={REMOTE_COPY.searchPlaceholder}
        leftIcon={Search}
        nativeUndo
        autoComplete="off"
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
      />
      {search.empty && <p className="py-4 text-center text-md text-fg-muted">{search.query ? REMOTE_COPY.noResults : REMOTE_COPY.nobodyWithRoutine}</p>}
      <ul className="flex flex-col gap-1">
        {search.results.map((person) => {
          const current = person.id === currentId
          const place = places.get(person.id)
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => onPick(person)}
                aria-current={current || undefined}
                className={cn('flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left hover:bg-fg/5', current && 'bg-brand-soft')}
              >
                <span aria-hidden className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: person.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-fg">{person.fullName}</span>
                  {place && <span className="block truncate text-sm text-fg-muted">{current ? REMOTE_COPY.current : REMOTE_COPY.shownAt(place)}</span>}
                </span>
                {current && <Check size={18} aria-hidden className="shrink-0 text-brand-strong" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
