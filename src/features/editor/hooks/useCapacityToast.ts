import { useCallback } from 'react'
import { CAPACITY_TEXTS } from '@/config/capacity'
import { useToast } from '@/hooks'
import type { CapacityRefusal } from '@/lib/capacity'

/** Explains with a toast why something did not fit in a day. */
export function useCapacityToast(): (refusal: CapacityRefusal | null) => void {
  const { toast } = useToast()
  return useCallback(
    (refusal) => {
      if (refusal) toast({ message: CAPACITY_TEXTS.refusals[refusal] })
    },
    [toast],
  )
}
