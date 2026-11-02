import { ChevronRight, MonitorPlay } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/cn'
import { paths } from '@/lib/routes'
import { MOBILE_SCREEN_TEXTS } from '@/features/display/config/mobile'
import { useMobilePeople } from '@/features/display/hooks/useMobilePeople'
import { MobileScreenBar } from './MobileScreenBar'

/** Modo TV on a phone: there is no TV here, so a simple list of people to open each one's view. */
export function MobileTvPage() {
  const { people, branding, theme } = useMobilePeople()

  return (
    <main className={cn('min-h-dvh font-sans', theme.root)}>
      <MobileScreenBar backHref={paths.clients()} backLabel={MOBILE_SCREEN_TEXTS.backToPanel} branding={branding} theme={theme} />
      <div className="flex flex-col gap-4 px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <h1 className="text-3xl font-extrabold tracking-tight">{MOBILE_SCREEN_TEXTS.peopleTitle}</h1>
        <p className={cn('flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-base leading-snug', theme.noteSurface, theme.secondaryText)}>
          <MonitorPlay size={20} aria-hidden className={cn('mt-0.5 shrink-0', theme.accentText)} />
          {MOBILE_SCREEN_TEXTS.tvNote}
        </p>
        {people.length === 0 && <p className={cn('py-8 text-center text-lg', theme.secondaryText)}>{MOBILE_SCREEN_TEXTS.nobody}</p>}
        <ul className="flex flex-col gap-2">
          {people.map(({ client, label }) => (
            <li key={client.id}>
              <a href={paths.display(client.id)} className={cn('flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 text-lg font-semibold', theme.card)}>
                <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="md" />
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{label}</span>
                <ChevronRight size={20} aria-hidden className="shrink-0 opacity-70" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
