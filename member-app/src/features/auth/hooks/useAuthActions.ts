import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { backend } from '@/services/backend'

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) => backend.signIn(identifier, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.member }),
  })
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (password: string) => backend.changePassword(password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.member }),
  })
}

export function useSignOut() {
  return useMutation({ mutationFn: () => backend.signOut() })
}
