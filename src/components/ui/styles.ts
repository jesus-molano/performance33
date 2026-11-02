// Shared class recipes for UI primitives (kept apart from components for fast refresh).

import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-strong text-brand-strong-contrast hover:bg-brand-strong/90 shadow-card',
  secondary: 'bg-surface text-fg border border-line-strong hover:bg-canvas shadow-card',
  ghost: 'text-fg-muted hover:bg-fg/5 hover:text-fg',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-card',
  dark: 'bg-ink text-white hover:bg-ink-soft',
}

/** 44 px is the minimum touch target; sm only gets smaller from md, where there is a mouse. */
export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-11 px-3 text-sm gap-1.5 rounded-lg md:h-9',
  md: 'h-11 px-4 text-md gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
}

/** Same sizes for buttons whose long label may wrap onto two lines (min height instead of height). */
export const BUTTON_WRAP_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 py-1.5 px-3 text-sm gap-1.5 rounded-lg md:min-h-9',
  md: 'min-h-11 py-2 px-4 text-md gap-2 rounded-xl',
  lg: 'min-h-12 py-2 px-5 text-base gap-2 rounded-xl',
}

/** Shared form control styling (44 px tall, clear focus, error state). */
export function controlClasses(hasError: boolean, extra?: string): string {
  return cn(
    'w-full rounded-xl border bg-surface px-3.5 text-base text-fg placeholder:text-fg-subtle transition-colors md:text-md',
    'focus:border-brand-strong focus:ring-3 focus:ring-brand-strong/15 focus:outline-none',
    'disabled:bg-canvas disabled:text-fg-subtle',
    hasError ? 'border-red-500' : 'border-line-strong',
    extra,
  )
}

/** aria-describedby value matching the ids Field renders. */
export function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  if (error) return `${id}-error`
  return hint ? `${id}-hint` : undefined
}

/** Bordered frame around an input + suffix (the frame shows the focus ring). */
export function suffixFrameClasses(hasError: boolean): string {
  return cn(
    'h-11 rounded-xl border bg-surface transition-colors',
    'focus-within:border-brand-strong focus-within:ring-3 focus-within:ring-brand-strong/15',
    hasError ? 'border-red-500' : 'border-line-strong',
  )
}
