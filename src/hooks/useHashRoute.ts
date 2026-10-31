import { useMemo, useSyncExternalStore } from 'react'
import { parseRoute, type Route } from '../lib/routes'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

/** Current route; re-renders on hash change. Navigate with navigate()/replaceRoute() from lib/routes. */
export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, getHash)
  return useMemo(() => parseRoute(hash), [hash])
}
