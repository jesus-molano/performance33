import { useCallback, useEffect, useState } from 'react'
import { hydrateDashboard, loadDashboardData, startDashboardSync } from '@/persistence/dashboardSync'

export type DashboardBootStatus = 'loading' | 'ready' | 'error'

export interface DashboardBootstrap {
  status: DashboardBootStatus
  retry: () => void
}

/** Loads the data for this session, then runs autosave + live sync until the dashboard closes. */
export function useDashboardBootstrap(): DashboardBootstrap {
  const [status, setStatus] = useState<DashboardBootStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let stop: (() => void) | null = null
    loadDashboardData().then(
      (data) => {
        if (!active) return
        hydrateDashboard(data)
        stop = startDashboardSync()
        setStatus('ready')
      },
      () => {
        if (active) setStatus('error')
      },
    )
    return () => {
      active = false
      stop?.()
    }
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }, [])

  return { status, retry }
}
