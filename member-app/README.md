# Performance33 · App de usuarios

La app con la que los usuarios del gimnasio reservan sus clases y ven su rutina. Android, iPhone y web, con Expo SDK 58.
Comparte con la web de monitores las reglas de reserva y el formato de las rutinas (`../shared`), así que un día se lee
igual en la pantalla del gimnasio y en el móvil.

- **Mis clases:** la próxima clase en grande, las demás, «Esta semana 1 de 2» y **Cancelar** (avisa si ya cuenta en la semana).
- **Reservar:** tira de días, y en cada clase «Quedan 3 plazas», «Completa · Lista de espera» o «Ya estás apuntado ✓».
- **Mi rutina:** «Hoy te toca: Día 2 · Empuje» y los días, con el mismo formato que las pantallas.
- **Perfil** (icono arriba a la derecha): cerrar sesión, privacidad y **Eliminar mi cuenta**.

## Probarla en tu ordenador

```bash
cd member-app
npm install
npm run web        # en el navegador
npm test           # pruebas de la lógica
npm run typecheck
```

Sin variables arranca en **Demo sin conexión**: datos inventados, nada se guarda ni se envía. Pulsa **Ver la demo** y luego
**Entrar en la demo**. Para probar el primer acceso con contraseña temporal, entra con un usuario que empiece por `nuevo`.

## Conectarla al gimnasio

Copia `.env.example` como `.env.local` y pon los **mismos valores públicos** que la web de monitores:

| Variable de la app | Igual que en la web |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_APP_URL` (opcional) | dirección pública de esta app; por defecto `https://performance33-socios.vercel.app` |

Antes, en Supabase, tienen que estar aplicados `supabase/schema.sql` y publicadas las funciones `login-username` y
`member-accounts`, con la dirección de esta app en `ALLOWED_ORIGINS` (README principal, paso 5).

## Publicar la versión web en Vercel (segundo proyecto)

1. **Add New → Project**, el mismo repositorio, **Root Directory** `member-app`, nombre `performance33-socios`.
   Deja activado **Include files outside the root directory** (la app usa `../shared`).
2. Variables: las dos `EXPO_PUBLIC_…` de arriba.
3. **Deploy.** `vercel.json` ya construye con `npx expo export -p web`, publica `dist/`, manda cualquier ruta a la app y pone
   las cabeceras de seguridad (si Supabase usa un dominio propio, añádelo a `connect-src`).

Se publica también:

- `/descargar`: el destino del QR, que **nunca cambia**. En iPhone abre la App Store y en Android Google Play; mientras no
  estén publicadas (`public/descargar/links.js` con `null`), abre la versión web, que se puede **añadir a la pantalla de inicio**.
  Al publicar en las tiendas solo hay que poner sus direcciones en `links.js`.
- `/privacidad`: la política de privacidad (copia de la de la web, con la parte de la app).
- `/borrar-cuenta`: eliminar la cuenta, también sin haber entrado (las tiendas piden una página así).

## Cómo entra un usuario

1. Su monitor le da acceso en la web (**Acceso a la app**): un nombre de usuario y una contraseña temporal.
2. Entra con el usuario (o con su email, si se lo pusieron) y esa contraseña, y elige la suya (10 caracteres, letras y números).
3. Si la temporal caducó (3 días) o el acceso está pausado, la app se lo dice: tiene que hablar con su monitor.

## Por dentro

Ver «Members' app» en `ARCHITECTURE.md`. En corto: expo-router (`src/app`), supabase-js con la sesión en SecureStore
(en trozos, por el límite de 2 KB) en el móvil y en localStorage en la web, react-query, textos en `src/config/copy.ts`,
colores y tamaños (botones de 48 px como mínimo) en `src/config/theme.ts`.

Pendiente para la fase 4: un icono de 1024 × 1024 px original (el actual sale ampliado del de 300 px de la web) y los
identificadores de las tiendas en `app.json`.
