import { useMemo, useState } from 'react'
import { findRemotePeople, type RemotePerson } from '@/features/screens'

export interface RemotePeopleSearch {
  query: string
  setQuery: (query: string) => void
  results: RemotePerson[]
  empty: boolean
}

/** The search of 'Cambiar persona' on the phone: people with a routine, by any part of the name. */
export function useRemotePeopleSearch(people: readonly RemotePerson[]): RemotePeopleSearch {
  const [query, setQuery] = useState('')
  const results = useMemo(() => findRemotePeople(people, query), [people, query])
  return { query, setQuery, results, empty: results.length === 0 }
}
