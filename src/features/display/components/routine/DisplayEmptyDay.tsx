import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface DisplayEmptyDayProps {
  hasDays: boolean
  theme: DisplayThemeClasses
}

export function DisplayEmptyDay({ hasDays, theme }: DisplayEmptyDayProps) {
  return (
    <div className={cn('flex flex-col items-center gap-[0.6em] rounded-[0.9em] px-[1em] py-[2.5em] text-center', theme.mutedCard)}>
      <Dumbbell size="1em" aria-hidden className={cn('text-[3em]', theme.accentText)} />
      <p className="text-[1.8em] font-semibold">{hasDays ? 'Este día aún no tiene ejercicios' : 'La rutina aún no tiene días'}</p>
      <p className={cn('text-[1.3em]', theme.secondaryText)}>Tu monitor la está preparando.</p>
    </div>
  )
}
