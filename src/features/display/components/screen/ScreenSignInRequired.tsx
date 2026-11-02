import { LogIn } from 'lucide-react'
import { DEFAULT_BRANDING } from '@/config/branding'
import { paths } from '@/lib/routes'
import { getDisplayTheme } from '@/features/display/utils/theme'
import { ScreenMessage } from './ScreenMessage'

const theme = getDisplayTheme(DEFAULT_BRANDING.displayTheme)

/** TV window without a session: no client data at all, and it recovers by itself when someone signs in. */
export function ScreenSignInRequired() {
  return (
    <div className="h-dvh bg-ink text-white">
      <ScreenMessage
        branding={DEFAULT_BRANDING}
        theme={theme}
        icon={LogIn}
        title="Inicia sesión"
        description={
          <>
            Entra en el{' '}
            <a href={paths.clients()} className="font-semibold underline">
              panel de monitores
            </a>{' '}
            desde este navegador. Esta pantalla se actualizará sola.
          </>
        }
      />
    </div>
  )
}
