import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface AppErrorBoundaryProps {
  children: ReactNode
  /** Clears what this device has stored (it may be what breaks the app) and reloads. */
  onReset: () => void
}

interface State {
  failed: boolean
}

/** Last line of defence: instead of a blank page, offer to reload or clear this device's copy. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <h1 className="text-xl font-semibold text-fg">Algo ha fallado al mostrar esta pantalla</h1>
        <p className="max-w-md text-md text-fg-muted">
          Prueba a recargar. Si sigue igual, borra lo que este dispositivo tiene guardado y vuelve a empezar.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 rounded-xl border border-line-strong bg-surface px-4 font-medium text-fg"
          >
            Recargar
          </button>
          <button type="button" onClick={this.props.onReset} className="h-11 rounded-xl bg-brand-strong px-4 font-medium text-brand-strong-contrast">
            Limpiar este dispositivo
          </button>
        </div>
      </div>
    )
  }
}
