import { KEEPALIVE_MAX_BODY_CHARS } from '@/config/app'

/**
 * Small writes keep going after the page is hidden or closed (a coach locking the phone right after
 * typing). Bigger ones cannot: the browser refuses them, so they go as normal requests.
 */
export function withKeepalive(init: RequestInit | undefined): RequestInit | undefined {
  const body = init?.body
  return typeof body === 'string' && body.length <= KEEPALIVE_MAX_BODY_CHARS ? { ...init, keepalive: true } : init
}
