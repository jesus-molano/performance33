import { useCallback, useEffect, useState } from 'react'
import { memberAccessService } from '@/features/members/services/instance'
import type { MemberAccess } from '@/features/members/types'

export interface MemberAccessState {
  status: 'loading' | 'ready' | 'error'
  /** Null: no access to the app (once `ready`). */
  access: MemberAccess | null
  /** Epoch ms of the last answer: what the account's state (an expired password) is read against. */
  checkedAt: number
  reload: () => void
}

interface Loaded extends Omit<MemberAccessState, 'reload'> {
  clientId: string
}

const LOADING = { status: 'loading', access: null, checkedAt: 0 } as const

/** A user's app account, kept fresh: live changes, focus, and after every action (`reload`). */
export function useMemberAccess(clientId: string): MemberAccessState {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((value) => value + 1), [])

  useEffect(() => {
    let alive = true
    memberAccessService.load(clientId).then(
      (access) => {
        if (alive) setLoaded({ clientId, status: 'ready', access, checkedAt: Date.now() })
      },
      () => {
        // A failed reload keeps what was already shown.
        if (alive) setLoaded((previous) => (previous?.clientId === clientId && previous.status === 'ready' ? previous : { clientId, ...LOADING, status: 'error' }))
      },
    )
    return () => {
      alive = false
    }
  }, [clientId, version])

  useEffect(() => {
    const unsubscribe = memberAccessService.subscribe(reload)
    window.addEventListener('focus', reload)
    return () => {
      unsubscribe()
      window.removeEventListener('focus', reload)
    }
  }, [reload])

  const current = loaded?.clientId === clientId ? loaded : LOADING
  return { status: current.status, access: current.access, checkedAt: current.checkedAt, reload }
}
