import { Check } from 'lucide-react'
import { AVATAR_COLORS } from '../config/colors'
import { cn } from '../lib/cn'
import { readableTextOn } from '../lib/color'

export interface ColorSwatchPickerProps {
  /** Group label, e.g. 'Color del avatar'. */
  label: string
  value: string
  onChange: (color: string) => void
  colors?: readonly string[]
}

/** Row of round colour swatches (44 px targets) behaving as a radio group. */
export function ColorSwatchPicker({ label, value, onChange, colors = AVATAR_COLORS }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-fg">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Color ${color}`}
              onClick={() => onChange(color)}
              className={cn(
                'flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-transform',
                selected ? 'ring-2 ring-fg' : 'hover:scale-105',
              )}
              style={{ backgroundColor: color, color: readableTextOn(color) }}
            >
              {selected && <Check size={18} strokeWidth={3} aria-hidden />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
