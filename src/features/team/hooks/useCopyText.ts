import { useCallback, useState } from 'react'
import { COPIED_FLAG_MS } from '@/config/app'
import { useToast } from '@/hooks'
import { TEAM_COPY } from '@/features/team/config'

export interface CopyTextApi {
  copied: boolean
  copy: () => Promise<void>
}

/** Copy to the clipboard, with a brief 'copied' state. */
export function useCopyText(text: string): CopyTextApi {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_FLAG_MS)
    } catch {
      toast({ message: TEAM_COPY.copyFailed, tone: 'error' })
    }
  }, [text, toast])

  return { copied, copy }
}
