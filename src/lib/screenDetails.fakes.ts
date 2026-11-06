// Fake browser screens for the tests of the screen detection (no React, no DOM needed).

import type { DetectedDisplay, PermissionLike, ScreenDetailsLike, ScreenEnv, ScreenLike } from './screenDetails'
import { toDetectedDisplays } from './detectedDisplays'

export const LAPTOP: ScreenLike = {
  availLeft: 0,
  availTop: 0,
  availWidth: 1920,
  availHeight: 1040,
  left: 0,
  top: 0,
  width: 1920,
  height: 1080,
  isPrimary: true,
  isInternal: true,
  label: 'Pantalla integrada',
}
export const tv = (left: number, label = 'Wireless Display'): ScreenLike => ({
  availLeft: left,
  availTop: 0,
  availWidth: 1920,
  availHeight: 1032,
  left,
  top: 0,
  width: 1920,
  height: 1080,
  isPrimary: false,
  isInternal: false,
  label,
})

export const displaysOf = (...screens: ScreenLike[]): DetectedDisplay[] => toDetectedDisplays(screens)

class FakePermission extends EventTarget implements PermissionLike {
  state: PermissionState
  constructor(state: PermissionState) {
    super()
    this.state = state
  }
  change(state: PermissionState) {
    this.state = state
    this.dispatchEvent(new Event('change'))
  }
}

class FakeDetails extends EventTarget implements ScreenDetailsLike {
  screens: readonly ScreenLike[]
  constructor(screens: readonly ScreenLike[]) {
    super()
    this.screens = screens
  }
  change(screens: readonly ScreenLike[]) {
    this.screens = screens
    this.dispatchEvent(new Event('screenschange'))
  }
}

class FakeScreen extends EventTarget {
  isExtended: boolean
  constructor(isExtended: boolean) {
    super()
    this.isExtended = isExtended
  }
  extend(isExtended: boolean) {
    this.isExtended = isExtended
    this.dispatchEvent(new Event('change'))
  }
}

export interface FakeBrowser {
  env: ScreenEnv
  permission: FakePermission
  details: FakeDetails
  screen: FakeScreen
  /** What the user answers when the browser asks. */
  answer: 'granted' | 'denied' | 'dismissed'
  calls: { getScreenDetails: number }
}

export function fakeBrowser(options: { permission?: PermissionState; screens?: ScreenLike[]; extended?: boolean; supported?: boolean } = {}): FakeBrowser {
  const permission = new FakePermission(options.permission ?? 'prompt')
  const details = new FakeDetails(options.screens ?? [LAPTOP, tv(1920)])
  const screen = new FakeScreen(options.extended ?? true)
  const browser: FakeBrowser = {
    permission,
    details,
    screen,
    answer: 'granted',
    calls: { getScreenDetails: 0 },
    env: {
      screen,
      queryPermission: () => Promise.resolve(permission),
      getScreenDetails:
        options.supported === false
          ? undefined
          : () => {
              browser.calls.getScreenDetails++
              if (permission.state === 'prompt' && browser.answer !== 'dismissed') permission.change(browser.answer)
              return permission.state === 'granted' ? Promise.resolve(details) : Promise.reject(new DOMException('no', 'NotAllowedError'))
            },
    },
  }
  return browser
}
