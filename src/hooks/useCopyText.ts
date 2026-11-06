import { useCallback, useState } from 'react'
import { COPIED_FLAG_MS } from '@/config/app'
import { useToast } from './useToast'

export interface CopyTextApi {
  copied: boolean
  copy: () => Promise<void>
}

/** Copy to the clipboard, with a brief 'copied' state; `failedMessage` says what to do when the browser refuses. */
export function useCopyText(text: string, failedMessage: string): CopyTextApi {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_FLAG_MS)
    } catch {
      toast({ message: failedMessage, tone: 'error' })
    }
  }, [failedMessage, text, toast])

  return { copied, copy }
}
