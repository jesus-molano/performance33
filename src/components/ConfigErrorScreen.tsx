/** Connection settings missing: the app refuses to start (see config/backend.ts). */
export function ConfigErrorScreen() {
  return (
    <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center">
      <h1 className="text-xl font-semibold text-fg">La aplicación no está bien configurada</h1>
      <p className="max-w-md text-md text-fg-muted">Faltan los datos de conexión. Avisa a quien instaló la aplicación para que revise la publicación.</p>
    </div>
  )
}
