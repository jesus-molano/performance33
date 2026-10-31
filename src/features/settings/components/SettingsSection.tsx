import type { ReactNode } from 'react'
import { Card } from '../../../components/ui'

export interface SettingsSectionProps {
  title: string
  description?: ReactNode
  /** Optional button(s) on the right of the title. */
  action?: ReactNode
  children: ReactNode
}

/** Titled card used by every settings panel. */
export function SettingsSection({ title, description, action, children }: SettingsSectionProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}
