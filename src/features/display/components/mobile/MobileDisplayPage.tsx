import { cn } from '@/lib/cn'
import { paths } from '@/lib/routes'
import { DisplayFallback } from '@/features/display/components/screen/DisplayFallback'
import { MOBILE_SCREEN_TEXTS } from '@/features/display/config/mobile'
import { useMobileDisplay } from '@/features/display/hooks/useMobileDisplay'
import type { RoutineDaysParams } from '@/features/display/hooks/useRoutineDays'
import { MobileBlockCard } from './MobileBlockCard'
import { MobileDayTabs } from './MobileDayTabs'
import { MobileScreenBar } from './MobileScreenBar'

/** Pantalla on a phone: a normal page with scroll, day tabs on top and no auto-fit. Reads ONLY sanitised live data. */
export function MobileDisplayPage(props: RoutineDaysParams) {
  const { routine, currentDay, dayNumber, flashBlockIds, goToDay, data, clientFirstName, branding, theme } = useMobileDisplay(props)

  return (
    <main className={cn('min-h-dvh font-sans', theme.root)}>
      <MobileScreenBar backHref={paths.tv()} backLabel={MOBILE_SCREEN_TEXTS.back} returnToPrevious branding={branding} theme={theme} />
      {routine ? (
        <>
          <header className="px-4 pb-2">
            <h1 className="text-3xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere]">{routine.clientFirstName}</h1>
            <p className={cn('tabular text-base font-medium', theme.secondaryText)}>{routine.weekLabel}</p>
          </header>
          {routine.days.length > 1 && <MobileDayTabs days={routine.days} dayNumber={dayNumber} theme={theme} onSelect={goToDay} />}
          <div className="flex flex-col gap-3 px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {routine.days.length === 1 && currentDay && <p className={cn('text-lg font-semibold', theme.accentText)}>{currentDay.title}</p>}
            {currentDay?.blocks.map((block) => (
              <MobileBlockCard key={block.id} block={block} theme={theme} flashing={flashBlockIds.has(block.id)} />
            ))}
            {!currentDay?.blocks.length && <p className={cn('py-8 text-center text-lg', theme.secondaryText)}>{MOBILE_SCREEN_TEXTS.emptyDay}</p>}
          </div>
        </>
      ) : (
        <div className="h-[calc(100dvh-3.5rem)]">
          <DisplayFallback hasData={data != null} name={clientFirstName} branding={branding} theme={theme} />
        </div>
      )}
    </main>
  )
}
