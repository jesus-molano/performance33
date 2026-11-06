import { Download } from 'lucide-react'
import { useAutoFullscreenPermission } from '@/hooks'
import { useIsAdmin } from '@/store'
import { AUTO_FULLSCREEN_COPY, AUTO_FULLSCREEN_FILES } from '@/features/screens/config/tvWindows'

const linkClass = 'inline-flex min-h-11 items-center gap-2 font-medium text-brand-strong underline-offset-4 hover:underline md:min-h-0'

/** How an admin turns it on: once per laptop, a Chrome policy downloaded from the app. */
function AutoFullscreenSetup() {
  return (
    <div className="mt-2 flex flex-col gap-2 text-sm text-fg-muted">
      <p>{AUTO_FULLSCREEN_COPY.adminIntro}</p>
      <ol className="list-decimal space-y-0.5 pl-5">
        {AUTO_FULLSCREEN_COPY.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-5">
        <a href={AUTO_FULLSCREEN_FILES.enable.href} download={AUTO_FULLSCREEN_FILES.enable.name} className={linkClass}>
          <Download size={16} aria-hidden />
          {AUTO_FULLSCREEN_COPY.enable}
        </a>
        <a href={AUTO_FULLSCREEN_FILES.disable.href} download={AUTO_FULLSCREEN_FILES.disable.name} className={linkClass}>
          <Download size={16} aria-hidden />
          {AUTO_FULLSCREEN_COPY.disable}
        </a>
      </div>
      <p className="text-fg-subtle">{AUTO_FULLSCREEN_COPY.onlyChrome}</p>
    </div>
  )
}

/** 'Pantalla completa automática: Activada ✓ / Sin activar'. The how-to is for admins only; coaches just click once on the TV. */
export function AutoFullscreenStatus() {
  const state = useAutoFullscreenPermission()
  const isAdmin = useIsAdmin()
  if (state === null) return null
  const on = state === 'granted'
  return (
    <div className="border-t border-line pt-3 text-sm">
      <p className="text-fg">
        <span className="font-medium">{AUTO_FULLSCREEN_COPY.label}: </span>
        <span className={on ? 'font-semibold text-emerald-700' : 'text-fg-muted'}>{on ? AUTO_FULLSCREEN_COPY.on : AUTO_FULLSCREEN_COPY.off}</span>
      </p>
      {!on && (isAdmin ? <AutoFullscreenSetup /> : <p className="mt-0.5 text-fg-muted">{AUTO_FULLSCREEN_COPY.offForCoaches}</p>)}
    </div>
  )
}
