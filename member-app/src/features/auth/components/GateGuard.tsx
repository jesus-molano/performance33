import { Redirect } from 'expo-router'
import type { ReactNode } from 'react'
import { Screen } from '@/components/ui/Screen'
import { ErrorState, LoadingState } from '@/components/ui/StateViews'
import { COPY } from '@/config/copy'
import { useGate } from '../hooks/useGate'
import { GATE_ROUTES, type Gate } from '../utils/gate'

interface GateGuardProps {
  /** The gates this screen is for; anyone else is sent to their own screen. */
  allow: readonly Gate[]
  dark?: boolean
  children: ReactNode
}

export function GateGuard({ allow, dark = false, children }: GateGuardProps) {
  const { gate, memberError, retry } = useGate()
  if (gate === 'loading') {
    return (
      <Screen dark={dark} centered>
        {memberError ? <ErrorState message={COPY.common.connection} onRetry={retry} /> : <LoadingState dark={dark} />}
      </Screen>
    )
  }
  if (!allow.includes(gate)) return <Redirect href={GATE_ROUTES[gate]} />
  return children
}
