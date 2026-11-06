// Whether someone is signed in on this device, and (offline demo) whether they chose to try it.
// Signing out forgets every cached answer, so the next person never sees the previous one's data.

import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { backend } from '@/services/backend'
import type { SessionStatus } from './utils/gate'

interface AuthState {
  session: SessionStatus
  demoAccepted: boolean
  acceptDemo: () => void
}

const AuthContext = createContext<AuthState>({ session: 'loading', demoAccepted: false, acceptDemo: () => {} })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<SessionStatus>('loading')
  const [demoAccepted, setDemoAccepted] = useState(false)

  useEffect(() => {
    let active = true
    const apply = (signedIn: boolean) => {
      if (!active) return
      if (!signedIn) queryClient.clear()
      setSession(signedIn ? 'signed-in' : 'signed-out')
    }
    backend.hasSession().then(apply, () => apply(false))
    const stop = backend.onSessionChange(apply)
    return () => {
      active = false
      stop()
    }
  }, [queryClient])

  const value = useMemo(() => ({ session, demoAccepted, acceptDemo: () => setDemoAccepted(true) }), [session, demoAccepted])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
