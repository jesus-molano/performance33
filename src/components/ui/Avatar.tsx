import { readableTextOn } from '../../lib/color'
import { cn } from '../../lib/cn'
import { getInitials } from '../../lib/format'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-24 text-3xl',
}

export interface AvatarProps {
  firstName: string
  lastName?: string
  /** Background colour (hex). */
  color: string
  imageUrl?: string
  size?: AvatarSize
  className?: string
}

/** Initials on a coloured circle (or an image). Decorative: pair it with the visible name. */
export function Avatar({ firstName, lastName = '', color, imageUrl, size = 'md', className }: AvatarProps) {
  const classes = cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none', SIZES[size], className)
  if (imageUrl) return <img src={imageUrl} alt="" className={cn(classes, 'object-cover')} />
  return (
    <span aria-hidden className={classes} style={{ backgroundColor: color, color: readableTextOn(color) }}>
      {getInitials(firstName, lastName)}
    </span>
  )
}
