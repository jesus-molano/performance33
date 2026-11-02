import { ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui'
import type { StaffRole } from '@/types'

/** Demo buttons of local test mode. LoginPage only renders them when `auth.demoSignIn` exists. */
export function LocalDemoLogin({ onEnter }: { onEnter: (role: StaffRole) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" fullWidth leftIcon={ShieldCheck} onClick={() => onEnter('admin')}>
        Entrar como administrador
      </Button>
      <Button variant="secondary" size="lg" fullWidth leftIcon={User} onClick={() => onEnter('monitor')}>
        Entrar como monitor
      </Button>
    </div>
  )
}
