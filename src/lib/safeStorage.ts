// localStorage can be missing or throw (private mode, blocked site data): it must never break a screen.
// Only for per-viewer conveniences (remembered panels, TV setup), never for app data.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Per-viewer convenience only.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Per-viewer convenience only.
  }
}

/** sessionStorage: what this window remembers until it closes (a reload keeps it). */
export function readSessionStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSessionStorage(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Per-viewer convenience only.
  }
}
