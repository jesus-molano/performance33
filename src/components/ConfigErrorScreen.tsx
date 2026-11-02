/** Only one of the two connection settings is present: the app refuses to start (see config/backend.ts). */
export function ConfigErrorScreen() {
  return (
    <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center">
      <h1 className="text-xl font-semibold text-fg">La aplicación no está bien configurada</h1>
      <p className="max-w-md text-md text-fg-muted">
        Falta uno de los dos datos de conexión. Revisa la configuración de la publicación siguiendo las instrucciones del README.
      </p>
    </div>
  )
}
