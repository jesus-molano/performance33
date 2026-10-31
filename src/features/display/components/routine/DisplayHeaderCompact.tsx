import type { DisplayDay, DisplayRoutine } from '@/lib/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DisplayLogo } from './DisplayLogo'

interface DisplayHeaderCompactProps {
  routine: DisplayRoutine
  day: DisplayDay | null
  theme: DisplayThemeClasses
}

/** Narrow-slot header (3-4 TV columns): small logo + week on one line, first name and day on the next. */
export function DisplayHeaderCompact({ routine, day, theme }: DisplayHeaderCompactProps) {
  return (
    <header className="flex flex-col gap-[0.2em]">
      <div className="flex items-center justify-between gap-[0.6em]">
        <DisplayLogo branding={routine.branding} theme={theme} className="h-[1.7em]" />
        <span
          className={`tabular shrink-0 rounded-full px-[0.6em] py-[0.1em] text-[1.1em] font-semibold ${theme.outlineBadge}`}
        >
          {routine.weekLabel}
        </span>
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-[0.5em]">
        <h1 className="max-w-full truncate text-[2.6em] leading-[1.05] font-extrabold tracking-tight">
          {routine.clientFirstName}
        </h1>
        {day && <p className={`text-[1.35em] leading-tight font-semibold ${theme.accentText}`}>{day.title}</p>}
      </div>
    </header>
  )
}
