import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn'

/** Centered page column with the standard gutters. */
export function PageContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8', className)}>{children}</div>
}

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Buttons on the right (stack under the title on mobile). */
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** '‹ Clientes' link above a detail page title. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="-ml-2 mb-3 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-[15px] font-medium text-fg-muted hover:bg-fg/5 hover:text-fg"
    >
      <ChevronLeft size={18} aria-hidden />
      {children}
    </a>
  )
}
