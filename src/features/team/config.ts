import type { SelectOption } from '@/components/ui'
import type { StaffRole } from '@/types'

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Administrador',
  monitor: 'Monitor',
}

export const ROLE_OPTIONS: ReadonlyArray<SelectOption<StaffRole>> = [
  { value: 'monitor', label: ROLE_LABELS.monitor },
  { value: 'admin', label: ROLE_LABELS.admin },
]

export const STAFF_NAME_MAX_LENGTH = 30

export const TEAM_COPY = {
  googleHint: 'Esa persona podrá entrar con Google usando ese email.',
  passwordHint: 'Si prefiere email y contraseña, el administrador tiene que crearle la cuenta y la contraseña: los pasos están en la guía de instalación (README).',
} as const
