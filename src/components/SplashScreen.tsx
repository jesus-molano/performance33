import { LoaderCircle } from 'lucide-react'

/** Black screen with a spinner while the session or the data load. */
export function SplashScreen() {
  return (
    <div role="status" aria-label="Cargando" className="flex min-h-dvh items-center justify-center bg-ink text-brand">
      <LoaderCircle size={36} aria-hidden className="animate-spin" />
    </div>
  )
}
