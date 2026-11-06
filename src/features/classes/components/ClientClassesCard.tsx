import { CalendarDays } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { paths } from '@/lib/routes'
import { CLIENT_UPCOMING_MAX } from '@/features/classes/config/classes'
import { CLIENT_CLASSES_COPY } from '@/features/classes/config/copy'
import { useClientClasses } from '@/features/classes/hooks/useClassesData'
import { formatGymDayShort, formatGymTime } from '@/features/classes/utils/time'

/** On the user's page: "Esta semana: 1 de 2" and their next classes, each linking to its day in Clases. */
export function ClientClassesCard({ clientId }: { clientId: string }) {
  const { status, data } = useClientClasses(clientId)
  const usage = data?.usage
  const over = usage?.quota != null && usage.used >= usage.quota
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
          <CalendarDays size={18} aria-hidden className="text-brand-strong" />
          {CLIENT_CLASSES_COPY.title}
        </h2>
        <a href={paths.classes()} className="inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium text-brand-strong hover:bg-brand-soft">
          {CLIENT_CLASSES_COPY.seeAll}
        </a>
      </div>
      {!data ? (
        <p className="text-md text-fg-muted">{status === 'error' ? CLIENT_CLASSES_COPY.loadFailed : '…'}</p>
      ) : (
        <>
          <p className="text-md text-fg">
            {CLIENT_CLASSES_COPY.week}: <span className={cn('font-semibold tabular', over && 'text-amber-700')}>{CLIENT_CLASSES_COPY.usage(data.usage.used, data.usage.quota)}</span>
            {over && <span className="text-sm text-fg-muted"> · {CLIENT_CLASSES_COPY.over}</span>}
          </p>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-fg-muted">{CLIENT_CLASSES_COPY.upcoming}</h3>
            {data.upcoming.length === 0 ? (
              <p className="text-md text-fg-muted">{CLIENT_CLASSES_COPY.none}</p>
            ) : (
              <ul className="flex flex-col">
                {data.upcoming.slice(0, CLIENT_UPCOMING_MAX).map(({ bookingId, slot, status: bookingStatus, waitlistPosition }) => (
                  <li key={bookingId}>
                    <a href={paths.classes(slot.gymDate)} className="-mx-2 flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-canvas">
                      <span className="w-20 shrink-0 text-sm text-fg-muted first-letter:uppercase">{formatGymDayShort(slot.gymDate)}</span>
                      <span className="text-md font-semibold text-fg tabular">{formatGymTime(slot.startsAt)}</span>
                      <span className="min-w-0 flex-1 truncate text-md text-fg-muted">{slot.name}</span>
                      {bookingStatus === 'waitlisted' && (
                        <Badge tone="info" size="sm">
                          {CLIENT_CLASSES_COPY.waitlist(waitlistPosition)}
                        </Badge>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
