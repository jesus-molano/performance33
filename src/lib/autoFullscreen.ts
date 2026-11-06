// Whether this browser lets a TV window go fullscreen by itself, with no click: Chrome does it only for the addresses
// in its AutomaticFullscreenAllowedForUrls policy (public/teles/activar-pantalla-completa.reg). Pure: the query is
// passed in, so tests need no browser.

/** granted: the policy is on · off: the window needs a click · unsupported: this browser cannot even say (older ones). */
export type AutoFullscreenState = 'granted' | 'off' | 'unsupported'

export interface PermissionStatusLike extends EventTarget {
  readonly state: PermissionState
}

/** `navigator.permissions.query`, which older browsers reject with a TypeError for an unknown descriptor. */
export type PermissionQuery = (descriptor: { name: string; allowWithoutGesture: boolean }) => Promise<PermissionStatusLike>

export const AUTO_FULLSCREEN_DESCRIPTOR = { name: 'fullscreen', allowWithoutGesture: true } as const

export const autoFullscreenState = (status: PermissionStatusLike | null): AutoFullscreenState =>
  !status ? 'unsupported' : status.state === 'granted' ? 'granted' : 'off'

/** The permission, or null when the browser does not know it (or has no Permissions API). */
export async function queryAutoFullscreen(query: PermissionQuery | undefined): Promise<PermissionStatusLike | null> {
  if (!query) return null
  try {
    return await query({ ...AUTO_FULLSCREEN_DESCRIPTOR })
  } catch {
    return null
  }
}
