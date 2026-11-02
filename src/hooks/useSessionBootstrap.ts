import { useEffect } from 'react'
import { startSession } from '@/auth'

/** Starts the login session of this window (dashboards and TV windows alike). */
export function useSessionBootstrap(): void {
  useEffect(() => startSession(), [])
}
