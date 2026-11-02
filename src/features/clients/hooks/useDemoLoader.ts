import { useCallback } from 'react'
import { useToast } from '@/hooks'
import { useAppActions, useAppData, useIsAdmin } from '@/store'

export interface DemoLoaderApi {
  /** No clients and no routines at all: a brand-new database. */
  isEmptyDatabase: boolean
  canLoadDemo: boolean
  loadDemo: () => void
}

/** Empty database: an admin can upload the demo data; everyone else sees a neutral empty state. */
export function useDemoLoader(): DemoLoaderApi {
  const isEmptyDatabase = useAppData((data) => data.clients.length === 0 && data.programs.length === 0)
  const isAdmin = useIsAdmin()
  const { loadDemoData } = useAppActions()
  const { toast } = useToast()

  const loadDemo = useCallback(() => {
    loadDemoData()
    toast({ message: 'Datos de demostración cargados', tone: 'success' })
  }, [loadDemoData, toast])

  return { isEmptyDatabase, canLoadDemo: isEmptyDatabase && isAdmin, loadDemo }
}
