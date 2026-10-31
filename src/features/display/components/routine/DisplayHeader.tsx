import type { DisplayDay, DisplayRoutine } from '../../../../lib/display'
import type { DisplayThemeClasses } from '../../utils/theme'
import { DisplayLogo } from './DisplayLogo'

interface DisplayHeaderProps {
  routine: DisplayRoutine
  day: DisplayDay | null
  theme: DisplayThemeClasses
}

/** Logo + week, the client's first name LARGE (they look for it across 3 columns) and the day. */
export function DisplayHeader({ routine, day, theme }: DisplayHeaderProps) {
  return (
    <header className="flex flex-col gap-[0.5em]">
      <div className="flex items-center justify-between gap-[0.8em]">
        <DisplayLogo branding={routine.branding} theme={theme} />
        <span
          className={`tabular shrink-0 rounded-full px-[0.8em] py-[0.25em] text-[1.15em] font-semibold ${theme.outlineBadge}`}
        >
          {routine.weekLabel}
        </span>
      </div>
      <div className="mt-[0.3em]">
        <h1 className="truncate text-[3.6em] leading-[1.05] font-extrabold tracking-tight">
          {routine.clientFirstName}
        </h1>
        {day && (
          <p className={`mt-[0.1em] text-[1.7em] leading-tight font-semibold ${theme.accentText}`}>{day.title}</p>
        )}
      </div>
      <span aria-hidden className={`h-[0.22em] w-[3.2em] rounded-full ${theme.badge}`} />
    </header>
  )
}
