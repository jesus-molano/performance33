# Performance33 · Rutinas

Panel para los monitores de Performance33: rutinas personalizadas por cliente, notas internas y
pantallas para las teles del gimnasio (una columna por cliente o Modo TV con 3 columnas).

## Cómo arrancarlo

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev       # abre http://localhost:5173
```

## Otros comandos

```bash
npm run build     # comprueba tipos y genera la versión final en dist/
npm run preview   # sirve dist/ en local
npm run lint      # revisa el código con oxlint
```

`dist/` es una web estática (rutas con `#`), así que se puede subir a cualquier hosting.

## Datos

Esta demo guarda todo en el navegador (localStorage); la primera vez carga datos de ejemplo.
En **Ajustes → Datos** puedes descargar una copia, restaurarla o volver a los datos de ejemplo.
El acceso a los datos pasa por una interfaz `Repository` (`src/persistence`) para poder cambiarlo
por Supabase u otro backend sin tocar las pantallas.

La arquitectura y las normas de código están en [ARCHITECTURE.md](./ARCHITECTURE.md).
