import type { Route } from '@/lib/routes'
import type { NavLinkItem } from '@/features/shell/config'

export function isNavActive(link: NavLinkItem, route: Route): boolean {
  return link.activeOn.includes(route.name)
}

/** 'Ctrl' on Windows/Linux, '⌘' on Apple devices (tooltips only). */
export function modifierKeyLabel(): string {
  const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent
  return /Mac|iPhone|iPad/i.test(agent) ? '⌘' : 'Ctrl'
}
