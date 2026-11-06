import { CalendarCheck } from 'lucide-react'
import { NEXT_DAY_COPY, useNextDay } from '@/features/sessions'

/** 'Le toca: Día 3 · Pierna', from the last day the person showed on a screen. Nothing without days. */
export function NextDayLine({ clientId }: { clientId: string }) {
  const next = useNextDay(clientId)
  if (!next) return null
  return (
    <p className="flex items-center gap-2 text-md text-fg" title={NEXT_DAY_COPY.hint}>
      <CalendarCheck size={18} aria-hidden className="shrink-0 text-brand-strong" />
      <span>
        {NEXT_DAY_COPY.label}: <span className="font-semibold">{next.label}</span>
      </span>
    </p>
  )
}
