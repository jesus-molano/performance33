import type { ReactNode } from 'react'
import { BrandLogo } from '@/features/shell'

export interface AuthShellProps {
  title: string
  description?: ReactNode
  /** Small line under the logo, e.g. the local test mode badge. */
  badge?: ReactNode
  children?: ReactNode
}

/** Black full-screen page with the logo and a white card: every screen before entering the app. */
export function AuthShell({ title, description, badge, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-ink px-4 py-10">
      <BrandLogo className="h-14 sm:h-16" />
      {badge && <div className="mt-4 flex w-full justify-center">{badge}</div>}
      <main className="flex w-full max-w-md flex-1 animate-fade-in flex-col justify-center py-8">
        <div className="flex flex-col gap-5 rounded-2xl bg-surface p-6 shadow-pop sm:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
            {description && <p className="mt-1.5 text-md text-fg-muted">{description}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
