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
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[0.6em] px-[0.3em]">
      <h1 className="truncate text-[2.15em] leading-[1.1] font-extrabold tracking-tight">{routine.clientFirstName}</h1>
      <DisplayLogo branding={routine.branding} theme={theme} className="ml-auto h-[1.9em]" />
      <p className={`truncate text-[1.35em] leading-[1.2] font-bold ${theme.accentText}`}>{day?.title}</p>
      <p className={`tabular text-right text-[1.2em] leading-[1.2] font-semibold whitespace-nowrap ${theme.secondaryText}`}>
        {routine.weekLabel}
      </p>
    </header>
  )
}
