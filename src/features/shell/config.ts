import { CircleAlert, CircleCheck, LoaderCircle, Settings, Users, type LucideIcon } from 'lucide-react'
import { TV_MAX_SECTIONS } from '@/config/app'
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
  { id: 'clients', label: 'Usuarios', icon: Users, href: paths.clients(), activeOn: ['clients', 'client', 'program'] },
  { id: 'settings', label: 'Ajustes', icon: Settings, href: paths.settings(), activeOn: ['settings'] },
]

export const TV_LAUNCHER = {
  label: 'Pantallas',
  hint: `Una ventana por tele · hasta ${TV_MAX_SECTIONS} personas en cada una`,
  add: 'Añadir pantalla',
  isOpen: 'Abierta',
  open: 'Abrir',
  nobody: 'Sin personas todavía',
  removeLabel: (title: string) => `Quitar ${title}`,
  removeConfirm: {
    title: (title: string) => `¿Quitar ${title}?`,
    description: 'Se cerrará su ventana y se olvidarán sus columnas. Podrás añadirla de nuevo cuando quieras.',
    confirmLabel: 'Quitar',
  },
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
  error: { label: 'Sin conexión, reintentando…', icon: CircleAlert, tone: 'text-red-600' },
}
