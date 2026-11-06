import { useMutation } from '@tanstack/react-query'
import { backend } from '@/services/backend'

/** Frees the member's places, deletes their login and signs out (the session change takes them to "Entrar"). */
export function useDeleteAccount() {
  return useMutation({ mutationFn: () => backend.deleteAccount() })
}
