import { useCallback, useState } from 'react'
import type { FitStatus } from '@/features/display'
import { PREVIEW_DETAIL_HIDDEN_NOTE, PREVIEW_FIT_WARNING } from '@/features/editor/config'

export interface PreviewFit {
  /** Message when the day does not fit / reads too small on the TV, else null. */
  warning: string | null
  /** Message when cues, tempo or notes are hidden on the TV so the day fits, else null. */
  notice: string | null
  onFitChange: (status: FitStatus) => void
}

export function usePreviewFit(): PreviewFit {
  const [status, setStatus] = useState<FitStatus>({ overflowing: false, tooSmall: false, detailHidden: false })
  const onFitChange = useCallback((next: FitStatus) => setStatus(next), [])
  return {
    warning: status.overflowing || status.tooSmall ? PREVIEW_FIT_WARNING : null,
    notice: status.detailHidden ? PREVIEW_DETAIL_HIDDEN_NOTE : null,
    onFitChange,
  }
}
