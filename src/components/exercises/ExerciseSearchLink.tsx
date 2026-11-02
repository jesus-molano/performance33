import { GoogleIcon } from '@/components/GoogleIcon'
import { cn } from '@/lib/cn'
import { exerciseSearchUrl } from '@/lib/exerciseLibrary'

export interface ExerciseSearchLinkProps {
  name: string
  className?: string
}

/** Opens a Google search for the exercise in a new tab, without selecting or dragging what it sits on. Dashboard only. */
export function ExerciseSearchLink({ name, className }: ExerciseSearchLinkProps) {
  const url = exerciseSearchUrl(name)
  if (!url) return null
  const label = `Buscar «${name.trim()}» en Google`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        'group inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-fg/5 md:size-9',
        className,
      )}
    >
      <GoogleIcon className="size-4 opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
    </a>
  )
}
