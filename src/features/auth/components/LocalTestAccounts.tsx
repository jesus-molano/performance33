import { FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui'
import { LOCAL_TEST_PASSWORDS } from '@/data/seed/team'
import { AUTH_COPY } from '@/features/auth/config'

/** Local test mode only: the badge and the accounts that can enter. On a dark background. */
export function LocalTestAccounts() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
      <Badge tone="warning" icon={FlaskConical}>
        Modo local de pruebas
      </Badge>
      <div className="w-full rounded-xl border border-ink-line px-4 py-3 text-left text-sm text-white">
        <p className="mb-2 font-semibold">{AUTH_COPY.localAccountsTitle}</p>
        <ul className="flex flex-col gap-2">
          {Object.entries(LOCAL_TEST_PASSWORDS).map(([username, password]) => (
            <li key={username}>
              <span className="font-medium">{username}</span> / <span className="font-medium">{password}</span>
              <span className="block text-xs text-ink-muted">{AUTH_COPY.localAccountNotes[username]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
