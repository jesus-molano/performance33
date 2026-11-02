import { Link2 } from 'lucide-react'
import { GoogleIcon } from '@/components/GoogleIcon'
import { cn } from '@/lib/cn'
import { exerciseLinkUrl, normalizeExerciseLink } from '@/lib/exerciseLibrary'

export interface ExerciseLinkProps {
  name: string
  /** The exercise's own link, if it has one. Without it, this searches the name on Google. */
  link?: string | null
  className?: string
}

/** Always in a new tab, without selecting or dragging what it sits on. Dashboard only. */
export function ExerciseLink({ name, link, className }: ExerciseLinkProps) {
  const url = exerciseLinkUrl(name, link)
  if (!url) return null
  const ownLink = !!link && normalizeExerciseLink(link) !== null
  const label = ownLink ? `Abrir el enlace de «${name.trim()}»` : `Buscar «${name.trim()}» en Google`
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
      {ownLink ? (
        <Link2 size={18} aria-hidden className="text-brand-strong" />
      ) : (
        <GoogleIcon className="size-4 opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
      )}
    </a>
  )
}
