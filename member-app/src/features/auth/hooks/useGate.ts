import { backend } from '@/services/backend'
import { useAuth } from '../AuthProvider'
import { memberAccess } from '../utils/access'
import { gateFor, type Gate } from '../utils/gate'
import { useMember } from './useMember'

/** The screen this person belongs on. A failed my_member() counts as loading: the screen offers to retry. */
export function useGate(): { gate: Gate; memberError: boolean; retry: () => void } {
  const { session, demoAccepted } = useAuth()
  const member = useMember()
  const access = member.isSuccess ? memberAccess(member.data) : null
  const gate = gateFor({ session, demo: backend.mode === 'demo', demoAccepted, access })
  return { gate, memberError: member.isError, retry: () => void member.refetch() }
}
