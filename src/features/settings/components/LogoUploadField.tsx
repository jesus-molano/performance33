import { RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { IMAGE_ACCEPT } from '@/features/settings/config'
import { useImageUpload } from '@/features/settings/hooks/useImageUpload'

export interface LogoUploadFieldProps {
  label: string
  hint: string
  value: string
  defaultValue: string
  onChange: (url: string) => void
  /** Preview background: dark for the logo, light for the square icon. */
  surface: 'dark' | 'light'
}

/** Image preview + 'Subir imagen' (stored as a data URL) + 'Restaurar'. */
export function LogoUploadField({ label, hint, value, defaultValue, onChange, surface }: LogoUploadFieldProps) {
  const { inputRef, pick, onFileChange } = useImageUpload(onChange)
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div
        className={cn(
          'flex h-24 w-full shrink-0 items-center justify-center rounded-xl border p-3 sm:w-48',
          surface === 'dark' ? 'border-ink-line bg-ink' : 'border-line bg-canvas',
        )}
      >
        {value ? <img src={value} alt={label} className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-fg-subtle">Sin imagen</span>}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-md font-medium text-fg">{label}</p>
        <p className="text-sm text-fg-muted">{hint}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={Upload} onClick={pick}>
            Subir imagen
          </Button>
          {value !== defaultValue && (
            <Button variant="ghost" leftIcon={RotateCcw} onClick={() => onChange(defaultValue)}>
              Restaurar
            </Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} onChange={onFileChange} className="hidden" tabIndex={-1} aria-hidden />
      </div>
    </div>
  )
}
