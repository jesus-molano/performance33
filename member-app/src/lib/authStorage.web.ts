// Web: the session lives in localStorage. Private windows or blocked storage can throw: then there is simply no
// saved session and the member signs in again.

import type { AsyncKeyValueStore } from './chunkedStorage'

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const authStorage: AsyncKeyValueStore = {
  async getItem(key) {
    try {
      return storage()?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  async setItem(key, value) {
    try {
      storage()?.setItem(key, value)
    } catch {
      // Nothing to do: the session lasts until the tab closes.
    }
  },
  async removeItem(key) {
    try {
      storage()?.removeItem(key)
    } catch {
      // Already unreachable.
    }
  },
}
