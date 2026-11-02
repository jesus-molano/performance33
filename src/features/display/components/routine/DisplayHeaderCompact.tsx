import type { DisplayDay, DisplayRoutine } from '@/lib/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DisplayLogo } from './DisplayLogo'

interface DisplayHeaderCompactProps {
  routine: DisplayRoutine
  day: DisplayDay | null
  theme: DisplayThemeClasses
}

/** Narrow-slot header: first name and day on the left, logo and week on the right, two lines in all. */
export function DisplayHeaderCompact({ routine, day, theme }: DisplayHeaderCompactProps) {
  return (
    <header className="flex flex-col px-[0.3em]">
      <div className="flex items-center gap-x-[0.6em]">
        <h1 className="min-w-0 flex-1 text-[2.15em] leading-[1.1] font-extrabold tracking-tight [overflow-wrap:anywhere]">{routine.clientFirstName}</h1>
        <DisplayLogo branding={routine.branding} theme={theme} className="h-[1.9em] shrink-0" />
      </div>
      <div className="flex items-baseline gap-x-[0.6em]">
        <p className={`min-w-0 flex-1 text-[1.35em] leading-[1.2] font-bold [overflow-wrap:anywhere] ${theme.accentText}`}>{day?.title}</p>
        <p className={`tabular shrink-0 text-right text-[1.2em] leading-[1.2] font-semibold whitespace-nowrap ${theme.secondaryText}`}>
          {routine.weekLabel}
        </p>
      </div>
    </header>
  )
}
