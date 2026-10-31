import { cn } from '../../../lib/cn'
import { useBrandLogo } from '../hooks/useBrandLogo'

export interface BrandLogoProps {
  /** Size the logo with height classes, e.g. 'h-10'. */
  className?: string
}

/** Gym logo for DARK backgrounds (falls back to the gym name in pink). */
export function BrandLogo({ className }: BrandLogoProps) {
  const { src, name, showText, onError } = useBrandLogo()
  if (showText) {
    return <span className={cn('flex items-center text-2xl font-bold tracking-tight text-brand', className)}>{name}</span>
  }
  return <img src={src} alt={name} onError={onError} className={cn('w-auto max-w-full object-contain', className)} />
}
