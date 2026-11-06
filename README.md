# Performance33 · Rutinas

Panel para los monitores de Performance33: rutinas personalizadas por usuario, notas internas y
pantallas para las teles del gimnasio. Se usa desde el ordenador del gimnasio y desde el móvil, la
tablet o el ordenador de casa de cada monitor. Todo el equipo comparte los mismos datos en la nube.

## Probarlo en tu ordenador

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev       # abre http://localhost:5173
```

Sin configurar nada, en tu ordenador arranca en **Modo local de pruebas**: entras con el formulario normal y
las cuentas de prueba que aparecen en la misma pantalla, y los datos se quedan solo en ese navegador. En cuanto
configuras la conexión (más abajo), ese modo desaparece por completo.

| Nombre de usuario | Contraseña | Para probar |
|---|---|---|
| `admin` | `admin1234` | Administrador |
| `monitor` | `monitor1234` | Monitor |
| `nueva` | `nueva1234` | Primer acceso: te pide crear una contraseña |

## Enseñar la demo en Vercel, sin configurar nada más

Para que lo prueben y den su opinión, sin base de datos: en [vercel.com](https://vercel.com), **Add New →
Project**, importa el repositorio, añade la variable `VITE_ALLOW_LOCAL_DEMO` con el valor `true` y pulsa **Deploy**.

- Entra quien tenga el enlace, con las cuentas de prueba que aparecen en la pantalla de entrada.
- Cada navegador tiene sus propios datos: no se comparten entre monitores ni dispositivos.
- **No metas datos reales de usuarios**: se quedan en ese navegador y los verá quien entre después.

Sin esa variable, y sin la conexión de abajo, la web publicada avisa de que falta configuración y no arranca.

Otros comandos:

```bash
npm run build     # comprueba tipos y genera la versión final en dist/
npm test          # pruebas, incluidas las reglas de permisos de la base de datos
npm run lint      # revisa el código
```

## Puesta en marcha con datos compartidos

Se hace una sola vez. Calcula unos 45 minutos.

### 1. Crear el proyecto de Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. En **Region** elige **West EU (Paris)** (`eu-west-3`). No se puede cambiar después.
3. Guarda la contraseña de la base de datos en un sitio seguro.

### 2. Crear las tablas y los permisos

En Supabase ve a **SQL Editor → New query**, pega el archivo `supabase/schema.sql` entero y pulsa **Run**.
Se puede volver a ejecutar sin romper nada.

**Al actualizar la app**, ejecuta primero el `schema.sql` nuevo y después publica la web: la versión con las pantallas
en la base de datos necesita sus tablas, y el aviso de qué teles están abiertas va por un canal privado que solo
funciona con los permisos de este archivo. No hace falta tocar **Realtime → Settings → Allow public access**: los
datos en directo de las tablas siguen protegidos por sus propios permisos.

**Si el proyecto ya tenía la versión anterior** (existe la tabla `staff`), el archivo se niega a ejecutarse y lo dice. Esa
versión no se puede convertir sola: guarda lo que necesites y, **sabiendo que esto borra todos los datos**, ejecuta primero:

```sql
drop table if exists public.notes, public.clients, public.programs, public.library_exercises, public.settings, public.staff cascade;
drop function if exists public.claim_staff_profile(), public.allow_password_account(text), public.current_staff_id(),
  public.staff_normalize_email(), public.staff_guard_update(), public.staff_guard_delete(), public.staff_keep_last_admin(),
  public.is_active_staff(), public.is_admin(), public.stamp_row() cascade;
```

### 3. Ajustes de acceso

Si usas la CLI de Supabase, `supabase/config.toml` ya los trae; cambia las líneas marcadas con `CAMBIAR` y, tras el paso 4,
ejecuta `supabase config push` con `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_SECRET` en el entorno. Si prefieres el panel, en **Authentication**:

- **Sign In / Providers**: desactiva **Allow new users to sign up**. Las cuentas solo las crea el administrador.
- **Sign In / Providers**: activa **Allow manual linking** (para «Conectar con Google» en Mi perfil).
- **Sign In / Providers → Email**: mínimo de 10 caracteres, con letras y números. Activa **Confirm email**: el
  administrador crea las cuentas ya confirmadas, y así nadie puede cambiar su dirección de acceso sin confirmarla.
  Deja apagado **Secure password change**: pediría un correo que las cuentas sin email no pueden recibir.
- Si tu plan lo permite, activa también la protección contra contraseñas filtradas.
- **URL Configuration → Site URL**: la dirección de tu web, por ejemplo `https://performance33.vercel.app`.
- **URL Configuration → Redirect URLs**: añade esa misma dirección. Para probar en local, usa otro proyecto de desarrollo:
  así nada que corra en el ordenador de alguien cuenta como la app.

### 4. Entrar con Google

En [Google Cloud Console](https://console.cloud.google.com):

1. Crea un proyecto (o usa uno que ya tengas).
2. En **APIs & Services → OAuth consent screen**, configura la pantalla de permiso: nombre de la
   aplicación, tu email de contacto y tipo **External**. Publícala para que no se limite a usuarios de prueba.
3. En **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Tipo: **Web application**.
   - **Authorized JavaScript origins**: la dirección de tu web.
   - **Authorized redirect URIs**: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
     (la dirección exacta aparece en Supabase, en el paso siguiente).
4. Copia el **Client ID** y el **Client secret**.

En Supabase, ve a **Authentication → Sign In / Providers → Google**, actívalo y pega los dos datos.

### 5. Publicar las dos funciones del servidor

Crean las cuentas y permiten entrar con nombre de usuario. Con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref TU_REFERENCIA
supabase secrets set ALLOWED_ORIGINS="https://performance33.vercel.app"
supabase functions deploy admin-users
supabase functions deploy login-username
```

`ALLOWED_ORIGINS` son las direcciones desde las que se puede llamar a las funciones. `SUPABASE_URL`,
`SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya las pone Supabase dentro de cada función: la clave
`service_role` nunca llega a la web. Si cambias de dominio, vuelve a ejecutar la línea de `ALLOWED_ORIGINS`.

### 6. Crear la primera cuenta de administrador

1. En Supabase, **Authentication → Users → Add user → Create new user**, con tu email, una contraseña de al menos
   10 caracteres con letras y números, y **Auto Confirm User** activado.
2. En **SQL Editor**, una sola instrucción, con tu email, el nombre de usuario y el nombre que quieras:

   ```sql
   insert into public.profiles (user_id, username, email, name, role)
   select id, 'tuusuario', email, 'Tu nombre', 'admin'
   from auth.users where email = 'tu.email@gmail.com';
   ```

Tu email no se guarda en el repositorio: solo en la base de datos. Todas las demás cuentas se crean desde la app.

### 7. Publicar en Vercel

1. En [vercel.com](https://vercel.com), **Add New → Project** e importa el repositorio.
2. Vercel detecta Vite solo. En **Environment Variables** añade estas dos:

   | Nombre | Dónde está el valor |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → **Project Settings → API** → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase → **Project Settings → API** → clave `anon` `public` |

3. Pulsa **Deploy**. Si cambias estas variables más tarde, vuelve a desplegar para que surtan efecto.

La clave `anon` es pública y va dentro de la web: lo que protege los datos son los permisos del paso 2.
**Nunca** uses la clave `service_role` aquí.

Si falta alguna de las dos, la web muestra un aviso y no arranca.

`vercel.json` añade las cabeceras de seguridad de la web. Si usas un dominio propio en Supabase, añádelo
en `connect-src`; si no, la web no podrá conectar.

Para usar la nube desde tu ordenador, copia `.env.example` como `.env.local` y rellénalo.

### 8. Primer acceso

1. Entra con tu email y la contraseña del paso 6, o con Google si es esa misma cuenta.
2. La biblioteca de ejercicios se carga sola en esa primera sesión, una única vez.
3. Si la base de datos está vacía, verás **Cargar datos de demostración**. Es opcional.
4. En **Ajustes → Equipo**, crea la cuenta de cada monitor.

## Cómo entra cada persona

Nadie se puede registrar: **cada cuenta la crea un administrador** en **Ajustes → Equipo**, con nombre, nombre de usuario,
rol y, si quiere, email. Al crearla se muestra una contraseña temporal **una sola vez**, para dársela en persona.
La primera vez que entre tendrá que elegir la suya (al menos 10 caracteres, con letras y números), y hasta entonces no ve
ningún dato. La temporal solo vale **3 días**: después hay que darle otra.

Hay un único formulario, para administradores y monitores por igual:

- **Email o nombre de usuario, y contraseña.** Se entra con cualquiera de los dos. El nombre de usuario no revela el email de nadie.
- **Continuar con Google.** Funciona si el email de Google es el de su cuenta (se conectan solos la primera vez),
  o si ha pulsado **Conectar con Google** en **Mi perfil**. Quien entra con la cuenta de Google de su email no tiene que crear
  contraseña. **Por eso, al crear una cuenta, revisa bien el email**: quien tenga esa cuenta de Google entrará como esa persona.
  Una cuenta de Google que no está en el equipo ve «Tu cuenta no tiene acceso».

En **Equipo** se ve quién tiene Google conectado. **Dar una contraseña nueva** también quita las cuentas de Google conectadas a mano.

Límites al entrar con nombre de usuario, en 15 minutos: 5 intentos por persona desde una misma conexión, 20 por persona
desde cualquier conexión y 50 desde una conexión a cualquier persona. Dar una contraseña nueva o reactivar la cuenta
desbloquea a esa persona. Entrar con email va directo al servidor de acceso, con su propio límite por conexión (30 cada 5 minutos).

**¿Ha olvidado su contraseña?** No hay correos: un administrador pulsa **Dar una contraseña nueva** en
**Ajustes → Equipo**, y esa persona vuelve a elegir la suya al entrar.

Cada uno puede cambiar en **Mi perfil** su nombre, su color y su contraseña (le pide la actual), y conectar o desconectar
Google (nunca su única forma de entrar: sin contraseña propia, primero tiene que crearla).

## Roles

| | Monitor | Administrador |
|---|---|---|
| Usuarios y rutinas | Sí | Sí |
| Biblioteca de ejercicios: añadir, editar y borrar cualquiera | Sí | Sí |
| Eliminar un usuario (se lleva sus notas) | No: lo archiva | Sí |
| Leer todas las notas internas | Sí | Sí |
| Escribir notas firmadas por uno mismo | Sí | Sí |
| Editar o borrar notas | Solo las suyas | Todas |
| Su propio nombre, color y contraseña (Mi perfil), sin repetir el nombre de otro | Sí | Sí |
| Marca, equipo, copias de seguridad, restablecer datos | No | Sí |

Nadie puede cambiar su propio rol, desactivarse ni borrarse, y siempre queda al menos un administrador activo.
Estas reglas las aplican la base de datos y las funciones del servidor, no solo la pantalla: las pruebas de
`supabase/schema.test.ts` y `supabase/functions/_shared/` lo comprueban. Un monitor no puede ver el nombre de usuario ni el email de los demás.

**Si alguien estropea datos:** cada cambio o borrado de usuarios, rutinas y ejercicios guarda una copia de lo anterior durante
30 días, también el cambio de quien tenga permiso. Las notas no: una nota borrada desaparece. Para recuperar una fila, en el SQL Editor:

```sql
select changed_at, operation, changed_by, data from public.row_history
where table_name = 'clients' and row_id = 'ID' order by changed_at desc;

insert into public.clients (id, data) values ('ID', 'DATOS DE ESA FILA')
on conflict (id) do update set data = excluded.data;
```

## La biblioteca de ejercicios

Vive en la base de datos y es de todo el equipo: cualquier ejercicio, también los unos 300 de la carga inicial, se
puede editar o borrar. Cada uno puede tener un **enlace** a un vídeo o una explicación: el icono del ejercicio lo
abre en otra pestaña, y si no tiene, lo busca en Google. Si borras uno que ya está en una rutina, la fila se queda
con su nombre como texto libre.

## Las pantallas del gimnasio

**Una ventana por tele.** Cada tele es una pantalla (Pantalla 1, Pantalla 2…) con su nombre y de 1 a 6 secciones,
una persona en cada una. Se configuran en **Ajustes → Pantallas** (o en el menú **Pantallas**), y es lo mismo para
todo el equipo. Más de 3 secciones en una tele de 27″ se lee pequeño a 3-4 m, y una rutina larga puede no caber
entera: lo dice una franja abajo («+3 ejercicios más abajo, no caben»). Hasta 4 secciones van una al lado de otra, cada
rutina de arriba abajo; con 5 o 6 se ponen en dos filas. Si una rutina es corta, la letra crece para llenar su sección.

### Cada mañana: abrir las teles

1. Enciende las teles y en el portátil pulsa **Win+K**: conecta cada tele y elige **Extender** (no «Duplicar»).
2. Abre la app en Chrome o Edge, entra y abre el menú **Pantallas** de la barra lateral.
3. La primera vez pulsa **Buscar teles** y, cuando el navegador pregunte, **Permitir**. Si sale «No hay ninguna tele
   conectada», vuelve al paso 1. Cada tele conectada tiene su pantalla: con alguna pantalla ya abierta en este
   portátil, si conectas una tele más, la app crea sola la pantalla que falta (y si apagas una, su pantalla se queda
   como «desconectada», no se borra). En los ordenadores de los monitores no se crea ninguna sola, aunque tengan
   otro monitor. Mientras se ven las teles, solo se puede quitar una pantalla cuya tele no esté conectada.
4. Pulsa cada pantalla («Abrir Pantalla 1 en «tele»»): la ventana se abre ya en su tele y ocupa toda la tele. Con la
   pantalla completa automática activada (abajo) se pone sola en pantalla completa; si no, pulsa allí una vez
   **Pantalla completa** (o la tecla F).
5. Si una tele se coloca en la que no toca, en **Ajustes → Pantallas → Teles detectadas** elige en qué tele se abre
   cada pantalla. Se guarda en ese portátil.

En Firefox, o si el navegador no ve las teles, la ventana se abre en el portátil: arrástrala a su tele y pulsa F11.
Solo entonces el menú **Pantallas** ofrece **Añadir pantalla** (en Ajustes → Pantallas sigue como opción avanzada).
Arriba, «Pantallas 2/2» dice cuántas están abiertas; «1 sin abrir» quiere decir que esa ventana está cerrada, y
«Pantalla 2 desconectada», que su tele se ha apagado o se ha caído Win+K.

Con alguna pantalla abierta, el menú **Pantallas** (y Ajustes → Pantallas) tiene dos botones:

- **Traer al portátil**: todas las ventanas de las teles salen de pantalla completa y vienen al portátil, una al lado de
  otra, para revisarlas. **Devolver a sus teles** (en el aviso) o **Colocar Pantalla N en su tele** las devuelve.
- **Cerrar todas**: cierra las ventanas de las teles. **Abrir otra vez** (en el aviso) la vuelve a abrir; si eran
  varias, el aviso las abre de una en una («Abrir Pantalla 1», luego «Abrir Pantalla 2»…), porque el navegador solo
  abre una ventana por clic. Si una ventana no se deja cerrar (no la abrió la app), dice «Cierra esta ventana con la
  X»; **Seguir mostrándola** la deja en su tele, en pantalla completa.

Funcionan aunque hayas recargado la página.

### Pantalla completa automática (una vez por portátil, lo hace un admin)

Chrome solo deja que una ventana se ponga sola en pantalla completa en las direcciones que permite una regla del
portátil. **Ajustes → Pantallas** dice «Pantalla completa automática: Activada ✓» o «Sin activar» (en Firefox o
Safari, «Este navegador no puede: usa Chrome»); si no lo está, un admin ve allí los dos archivos para descargar (están
en `public/teles/`: son públicos y no tienen nada secreto; solo se enseñan a los admins porque instalarlos pide
permiso de administrador de Windows):

1. Descarga y abre **activar-pantalla-completa.reg** y acepta (Windows pide permiso de administrador).
2. Reinicia Chrome: escribe `chrome://restart` en la barra de direcciones.

**quitar-pantalla-completa.reg** lo deshace. La regla vale solo para `https://performance33.vercel.app`; si la app
cambia de dirección, cambia también los dos archivos. Usan la entrada «1» de esa lista de Chrome y quitar solo borra
esa: si el informático del gimnasio ya usa la «1» para otra dirección, cambia el número en los dos archivos.

Para desarrollar en tu ordenador, `tools/teles/` tiene los mismos archivos para `http://localhost:5173` (entrada «2»).
No los uses en los portátiles del gimnasio. Si un portátil instaló la versión antigua de activar (con localhost),
abre también `tools/teles/quitar-pantalla-completa-local.reg`.

### Mandar a alguien a una sección

- En la ficha de cada usuario, cada día de su rutina tiene el botón **Pantalla** (en el móvil, **Mandar**). Púlsalo y
  toca la sección: la persona aparece en la tele al momento. Si ya estaba en otra sección, sale de allí; si la sección
  tenía a otra persona, se sustituye.
- El aviso dice a quién has mandado, qué día y a quién sustituye. **Deshacer** (o Ctrl+Z mientras se ve el aviso)
  lo deja como estaba, sin tocar lo que otro monitor haya cambiado después.
- En la **lista de usuarios** cada persona tiene también su botón **Pantalla**: primero eliges el día (sale el que ya
  tiene en la tele, o el Día 1 si no está en ninguna) y luego la sección. Si no tiene rutina, el botón sale gris («Sin rutina»).
- **Ctrl+clic** en **Pantalla** (o mantenerlo pulsado en el móvil) la manda directamente a la última sección que usaste
  (desde la lista, con el día que ya tiene en la tele, o el Día 1).
- Funciona igual desde el móvil, en cualquier red: solo hace falta que la ventana de la tele esté abierta en el portátil.

Desde el móvil, el Modo TV es una lista de personas para abrir la rutina de cada una como una página normal.

Las ventanas de las teles comparten la sesión del navegador y solo guardan los datos que se pueden
ver en público: nunca notas, objetivos ni comentarios internos. Si se cierra la sesión, muestran
«Inicia sesión» y se borra su copia.

**Una vez abiertas, se valen solas.** Puedes cerrar el panel: la tele sigue en directo y muestra lo que cambie
cualquier monitor desde su móvil. Solo necesita internet y que nadie cierre la sesión en ese navegador. Sin
conexión sigue mostrando lo último que recibió.

## Antes de usar datos reales

Esto es una demo. **Mientras lo sea, no metas datos reales de usuarios**, y menos de salud (lesiones,
molestias): en Europa son datos de categoría especial según el RGPD. Antes de usarla de verdad:

- Proyecto de Supabase en región de la UE (París), como en el paso 1.
- Acepta el acuerdo de tratamiento de datos (DPA) de Supabase y el de Vercel: los dos se piden desde su panel.
- Actualiza el registro de actividades y la información que das a los usuarios, y pide su consentimiento
  explícito para los datos de salud. Consúltalo con quien os lleve la protección de datos.
- Revisa que el plan de Supabase incluya las copias de seguridad que necesitas. Entretanto, descarga
  copias de vez en cuando desde **Ajustes → Datos** (solo administradores) y guárdalas en un sitio seguro:
  contienen datos privados.
- Desactiva en **Ajustes → Equipo** a quien deje de trabajar en el gimnasio.
- En el ordenador compartido, cierra sesión al acabar si no vas a dejar las teles funcionando.

En el ordenador del gimnasio, si se queda con la sesión abierta, quien pase por delante puede conectar su propia cuenta de Google en
Mi perfil. Revisa de vez en cuando la marca «Google conectado» en Equipo.

Antes de abrirlo a más gente, comprueba en el proyecto real, con una cuenta de Google que no esté en Equipo, que
no entra y no ve ningún dato. Esto no se puede probar sin un proyecto de Supabase: ver la lista al final de [ARCHITECTURE.md](./ARCHITECTURE.md).

La arquitectura y las normas de código están en [ARCHITECTURE.md](./ARCHITECTURE.md).
