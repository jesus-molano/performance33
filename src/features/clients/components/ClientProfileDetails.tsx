import { ChevronDown, Lock } from 'lucide-react'
import { useDisclosure } from '@/hooks'
import { cn } from '@/lib/cn'
import { CLIENT_PROFILE_COPY } from '@/features/clients/config'

export interface ClientProfileDetailsProps {
  goal?: string
  memberSince: string
  className?: string
}

function GoalText({ goal, clamp }: { goal: string; clamp: boolean }) {
  return (
    <>
      <Lock size={14} role="img" aria-label={CLIENT_PROFILE_COPY.goalPrivate} className="mt-0.5 shrink-0 text-private-icon" />
      <span className={cn('min-w-0 flex-1', clamp && 'truncate')}>
        <span className="font-medium text-fg">{CLIENT_PROFILE_COPY.goal}</span> {goal}
      </span>
    </>
  )
}

/**
 * The private goal (coaches only) under the pills. On phones one line cut with '…' that opens to the whole goal
 * and the start date, so the routine starts high; from sm the whole goal (the date is a pill there).
 */
export function ClientProfileDetails({ goal, memberSince, className }: ClientProfileDetailsProps) {
  const { isOpen, toggle } = useDisclosure()
  return (
    <div className={cn('text-sm text-fg-muted', className)}>
      <div className="sm:hidden">
        {goal ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            title={isOpen ? CLIENT_PROFILE_COPY.showLess : CLIENT_PROFILE_COPY.showMore}
            className="-my-3 flex min-h-11 w-full items-start gap-1.5 rounded-lg py-3 text-left"
          >
            <GoalText goal={goal} clamp={!isOpen} />
            <ChevronDown size={16} aria-hidden className={cn('mt-0.5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
          </button>
        ) : (
          <p className="text-xs">{memberSince}</p>
        )}
        {goal && isOpen && <p className="mt-1.5 text-xs">{memberSince}</p>}
      </div>
      {goal && (
        <p className="hidden items-start gap-1.5 text-md sm:flex">
          <GoalText goal={goal} clamp={false} />
        </p>
      )}
    </div>
  )
}
