import { Users } from 'lucide-react'
import { cn } from '@/lib/cn'
import { readableTextOn } from '@/lib/color'
import type { Branding } from '@/types'

function PreviewLabel({ children }: { children: string }) {
  return <p className="mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">{children}</p>
}

/** Live mini preview of the menu, a button and the TV display with the current branding. */
export function BrandingPreview({ branding }: { branding: Branding }) {
  const dark = branding.displayTheme === 'dark'
  return (
    <div className="flex flex-col gap-5" aria-label="Vista previa de la marca">
      <div>
        <PreviewLabel>Menú</PreviewLabel>
        <div className="rounded-xl bg-ink p-4">
          {branding.logoUrl && <img src={branding.logoUrl} alt="" className="mb-4 h-8 w-auto max-w-full object-contain" />}
          <div className="flex h-10 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-medium text-white">
            <Users size={16} aria-hidden style={{ color: branding.primaryColor }} />
            Clientes
          </div>
        </div>
      </div>
      <div>
        <PreviewLabel>Botones</PreviewLabel>
        <span
          className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium"
          style={{ backgroundColor: branding.accentColor, color: readableTextOn(branding.accentColor) }}
        >
          Editar rutina
        </span>
      </div>
      <div>
        <PreviewLabel>Pantalla del gimnasio</PreviewLabel>
        <div className={cn('rounded-xl p-4', dark ? 'bg-black text-white' : 'border border-line bg-white text-black')}>
          <p className="text-2xl font-bold">Laura</p>
          <p className="text-sm font-semibold" style={{ color: dark ? branding.primaryColor : branding.accentColor }}>
            Día 1 · Pierna · Semana 2 de 4
          </p>
          <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-current/15 pt-2">
            <span className="font-semibold">Sentadilla goblet</span>
            <span className="tabular font-semibold">4 × 10</span>
          </div>
        </div>
      </div>
    </div>
  )
}
