import { useEffect, useState } from 'react'
import { initDashboardData, startDashboardSync } from '@/persistence/dashboardSync'

/** Loads data synchronously before the first dashboard render, then runs autosave + live sync. */
export function useDashboardBootstrap(): void {
  useState(initDashboardData)
  useEffect(() => startDashboardSync(), [])
}
