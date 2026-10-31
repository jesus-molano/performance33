import { CircleAlert, CircleCheck, LoaderCircle, Settings, Users, type LucideIcon } from 'lucide-react'
import { paths, type RouteName } from '@/lib/routes'
import type { SaveStatus } from '@/store'

export interface NavLinkItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
  /** Routes on which this item is highlighted. */
  activeOn: readonly RouteName[]
}

export const NAV_LINKS: readonly NavLinkItem[] = [
  { id: 'clients', label: 'Clientes', icon: Users, href: paths.clients(), activeOn: ['clients', 'client', 'program'] },
  { id: 'settings', label: 'Ajustes', icon: Settings, href: paths.settings(), activeOn: ['settings'] },
]

export const TV_LAUNCHER = {
  label: 'Pantallas',
  hint: 'Modo TV · 3 clientes a la vez',
} as const

export interface SaveStatusMeta {
  label: string
  icon: LucideIcon
  tone: string
  spin?: boolean
}

export const SAVE_STATUS_META: Record<SaveStatus, SaveStatusMeta> = {
  idle: { label: 'Guardado', icon: CircleCheck, tone: 'text-fg-subtle' },
  saving: { label: 'Guardando…', icon: LoaderCircle, tone: 'text-fg-muted', spin: true },
  saved: { label: 'Guardado', icon: CircleCheck, tone: 'text-emerald-600' },
  error: { label: 'No se ha podido guardar', icon: CircleAlert, tone: 'text-red-600' },
}
