import { LogOut, RefreshCw } from 'lucide-react'
import { retrySession, signOut } from '@/auth'
import { Button } from '@/components/ui'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { useSessionEmail } from '@/store'
import { AUTH_COPY } from '@/features/auth/config'

interface SessionMessageProps {
  title: string
  description: string
  onRetry: () => void
  retryLabel: string
}

function SessionMessage({ title, description, onRetry, retryLabel }: SessionMessageProps) {
  return (
    <AuthShell title={title} description={description}>
      <div className="flex flex-col gap-2">
        <Button size="lg" fullWidth leftIcon={RefreshCw} onClick={onRetry}>
          {retryLabel}
        </Button>
        <Button variant="secondary" size="lg" fullWidth leftIcon={LogOut} onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </AuthShell>
  )
}

/** Signed in, but this email is not on the active staff list. */
export function NoAccessPage() {
  const email = useSessionEmail()
  return (
    <SessionMessage
      title={AUTH_COPY.noAccessTitle}
      description={email ? AUTH_COPY.noAccessAs(email) : AUTH_COPY.noAccessBody}
      onRetry={() => void retrySession()}
      retryLabel="Volver a comprobar"
    />
  )
}

/** Signed in, but the access check cannot reach the server. */
export function SessionOfflinePage() {
  return (
    <SessionMessage
      title={AUTH_COPY.offlineTitle}
      description={AUTH_COPY.offlineBody}
      onRetry={() => void retrySession()}
      retryLabel="Reintentar"
    />
  )
}

/** The access check worked, but the shared data could not be read. */
export function DataLoadFailedPage({ onRetry }: { onRetry: () => void }) {
  return (
    <SessionMessage title={AUTH_COPY.loadFailedTitle} description={AUTH_COPY.loadFailedBody} onRetry={onRetry} retryLabel="Reintentar" />
  )
}
