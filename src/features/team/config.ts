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
  passwordHint: 'Por ahora, la forma más sencilla de entrar es con Google. Para usar email y contraseña, pídeselo a quien instaló la aplicación.',
} as const
