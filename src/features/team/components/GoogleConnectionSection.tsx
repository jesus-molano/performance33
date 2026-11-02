import { GoogleIcon } from '@/components/GoogleIcon'
import { Button } from '@/components/ui'
import { TEAM_COPY } from '@/features/team/config'
import { useGoogleConnection } from '@/features/team/hooks/useGoogleConnection'

/** 'Mi perfil': connect or disconnect Google, never taking away the last way in. */
export function GoogleConnectionSection() {
  const { methods, busy, connect, disconnect } = useGoogleConnection()
  if (!methods) return null
  const description = !methods.google ? TEAM_COPY.googleNotConnected : methods.canDisconnectGoogle ? TEAM_COPY.googleConnected : TEAM_COPY.googleOnlyMethod
  return (
    <section className="flex items-center gap-3 border-t border-line pt-4">
      <GoogleIcon className="size-5 shrink-0" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-md font-medium text-fg">{TEAM_COPY.googleTitle}</p>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      {!methods.google && (
        <Button variant="secondary" disabled={busy} onClick={() => void connect()} wrap>
          {TEAM_COPY.googleConnect}
        </Button>
      )}
      {methods.canDisconnectGoogle && (
        <Button variant="secondary" disabled={busy} onClick={() => void disconnect()}>
          {TEAM_COPY.googleDisconnect}
        </Button>
      )}
    </section>
  )
}
