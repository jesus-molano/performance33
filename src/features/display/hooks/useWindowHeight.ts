import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}
const read = () => window.innerHeight

/** Height of this window (the whole TV for a TV window in fullscreen), live. */
export function useWindowHeight(): number {
  return useSyncExternalStore(subscribe, read)
}
