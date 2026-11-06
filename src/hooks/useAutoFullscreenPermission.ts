import { useEffect, useState } from 'react'
import { autoFullscreenState, queryAutoFullscreen, type AutoFullscreenState, type PermissionQuery } from '@/lib/autoFullscreen'

/** null until the browser answers. */
export type AutoFullscreenStatus = AutoFullscreenState | null

const browserQuery = (): PermissionQuery | undefined =>
  typeof navigator !== 'undefined' && navigator.permissions
    ? (descriptor) => navigator.permissions.query(descriptor as unknown as PermissionDescriptor)
    : undefined

/** Whether TV windows go fullscreen by themselves here (Chrome policy installed once per laptop), followed live. */
export function useAutoFullscreenPermission(): AutoFullscreenStatus {
  const [state, setState] = useState<AutoFullscreenStatus>(null)

  useEffect(() => {
    let active = true
    let status: Awaited<ReturnType<typeof queryAutoFullscreen>> = null
    const update = () => {
      if (active) setState(autoFullscreenState(status))
    }
    void queryAutoFullscreen(browserQuery()).then((result) => {
      if (!active) return
      status = result
      status?.addEventListener('change', update)
      update()
    })
    return () => {
      active = false
      status?.removeEventListener('change', update)
    }
  }, [])

  return state
}
