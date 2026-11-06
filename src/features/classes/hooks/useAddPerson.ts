// "Añadir usuario": search the active users not yet in the class and put one in (asking first when it is full).

import { useMemo, useState } from 'react'
import { useClients } from '@/store'
import { ADD_PERSON_RESULTS_MAX } from '@/features/classes/config/classes'
import type { Booking, SlotSummary } from '@/features/classes/types'
import { findAddablePeople, type AddablePeople } from '@/features/classes/utils/people'
import { peopleInSlot, type RosterClient } from '@/features/classes/utils/slotView'
import { useBookingActions } from './useBookingActions'

export interface AddPerson extends AddablePeople {
  query: string
  setQuery: (query: string) => void
  busyId: string | null
  add: (client: RosterClient) => void
}

/** After each person is added the search empties, ready for the next one. */
export function useAddPerson(slot: SlotSummary, bookings: readonly Booking[]): AddPerson {
  const clients = useClients()
  const { add } = useBookingActions()
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const inSlot = useMemo(() => peopleInSlot(bookings, slot.id), [bookings, slot.id])
  const found = useMemo(() => findAddablePeople(clients, inSlot, query, ADD_PERSON_RESULTS_MAX), [clients, inSlot, query])

  return {
    ...found,
    query,
    setQuery,
    busyId,
    add: (client) => {
      if (busyId) return
      setBusyId(client.id)
      void add(slot, client)
        .then((added) => {
          if (added) setQuery('')
        })
        .finally(() => setBusyId(null))
    },
  }
}
