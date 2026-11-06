import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { backend } from '@/services/backend'
import { useAuth } from '../AuthProvider'

/** The signed-in member (first name, username, plan…), or null without access. */
export function useMember() {
  const { session } = useAuth()
  return useQuery({ queryKey: QUERY_KEYS.member, queryFn: () => backend.myMember(), enabled: session === 'signed-in' })
}
