# Performance33 · Rutinas

Panel para los monitores de Performance33: rutinas personalizadas por cliente, notas internas y
pantallas para las teles del gimnasio. Se usa desde el ordenador del gimnasio y desde el móvil, la
tablet o el ordenador de casa de cada monitor. Todo el equipo comparte los mismos datos en la nube.

## Probarlo en tu ordenador

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev       # abre http://localhost:5173
```

Sin configurar nada, en tu ordenador arranca en **Modo local de pruebas**: entras con los botones
«Entrar como administrador» o «Entrar como monitor», sin contraseña, y los datos se quedan solo en ese
navegador. En cuanto configuras la conexión (más abajo), ese modo desaparece por completo.

## Enseñar la demo en Vercel, sin configurar nada más

Para que lo prueben y den su opinión, sin base de datos: en [vercel.com](https://vercel.com), **Add New →
Project**, importa el repositorio, añade la variable `VITE_ALLOW_LOCAL_DEMO` con el valor `true` y pulsa **Deploy**.

- Entra quien tenga el enlace, sin contraseña, como administrador o como monitor.
- Cada navegador tiene sus propios datos: no se comparten entre monitores ni dispositivos.
- **No metas datos reales de clientes**: se quedan en ese navegador y los verá quien entre después.

Sin esa variable, y sin la conexión de abajo, la web publicada avisa de que falta configuración y no arranca.

Otros comandos:

```bash
npm run build     # comprueba tipos y genera la versión final en dist/
npm test          # pruebas, incluidas las reglas de permisos de la base de datos
npm run lint      # revisa el código
```

## Puesta en marcha con datos compartidos

Se hace una sola vez. Calcula unos 30 minutos.

### 1. Crear el proyecto de Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. En **Region** elige **Central EU (Frankfurt)**. No se puede cambiar después.
3. Guarda la contraseña de la base de datos en un sitio seguro.

### 2. Crear las tablas y los permisos

1. En Supabase ve a **SQL Editor → New query**, pega el archivo `supabase/schema.sql` entero y pulsa **Run**.
   Se puede volver a ejecutar sin romper nada.
2. En otra consulta nueva, añade al primer administrador con **tu email de Google** y pulsa **Run**:

   ```sql
   insert into public.staff (email, name, role)
   values (lower('tu.email@gmail.com'), 'Tu nombre', 'admin');
   ```

Tu email no se guarda en el repositorio: solo en la base de datos.

### 3. Direcciones permitidas

En **Authentication → URL Configuration**:

- **Site URL**: la dirección de tu web, por ejemplo `https://performance33.vercel.app`.
- **Redirect URLs**: añade esa misma dirección y, para probar en local, `http://localhost:5173`.

### 4. Comprobar la confirmación de email (importante)

En **Authentication → Sign In / Providers → Email**, deja **Confirm email** activado (viene así).

### 5. Entrar con Google

En [Google Cloud Console](https://console.cloud.google.com):

1. Crea un proyecto (o usa uno que ya tengas).
2. En **APIs & Services → OAuth consent screen**, configura la pantalla de permiso: nombre de la
   aplicación, tu email de contacto y tipo **External**. Publícala para que no se limite a usuarios de prueba.
3. En **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Tipo: **Web application**.
   - **Authorized JavaScript origins**: la dirección de tu web y `http://localhost:5173`.
   - **Authorized redirect URIs**: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
     (la dirección exacta aparece en Supabase, en el paso siguiente).
4. Copia el **Client ID** y el **Client secret**.

En Supabase, ve a **Authentication → Sign In / Providers → Google**, actívalo y pega los dos datos.

### 6. Publicar en Vercel

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

### 7. Primer acceso

1. Entra con Google usando el email que pusiste en el paso 2.
2. Si la base de datos está vacía, verás **Cargar datos de demostración**. Es opcional.
3. En **Ajustes → Equipo**, añade a cada monitor con su email, su nombre y su rol.

## Cómo entra cada persona

Solo entra quien esté activo en **Ajustes → Equipo**. Cualquier otra cuenta ve «Tu cuenta no tiene
acceso», con el email con el que ha entrado, y ningún dato.

- **Con Google**: basta con que el administrador añada su email en Equipo. Es lo más sencillo.
- **Con email y contraseña**: hoy no se puede hacer desde la aplicación. Además de añadirla en Equipo, quien
  gestiona Supabase tiene que hacer dos cosas, en este orden:
  1. **Authentication → Users → Add user → Create new user**, con ese mismo email, una contraseña y
     **Auto Confirm User** activado.
  2. En **SQL Editor**: `select public.allow_password_account('su.email@ejemplo.com');`

  Después la persona puede cambiarla desde «He olvidado mi contraseña».

**Por qué el segundo paso.** Registrarse no se puede desactivar solo para las contraseñas (Google lo
necesita), así que alguien podría crear una cuenta con el email de un monitor y una contraseña suya, y
esperar a que el monitor confirme el correo. Por eso el primer acceso solo se concede a cuentas de
Google con ese mismo email o a las autorizadas así. **Avisa al equipo: que no pulse un correo de
confirmación que no haya pedido.**

## Correos de contraseña

El correo que trae Supabase de serie es solo para probar: **solo envía a direcciones de tu equipo**
(las que estén en la organización de Supabase) y muy pocos mensajes por hora. Para que «He olvidado mi
contraseña» funcione con cualquier monitor, configura un proveedor propio en **Authentication → Emails → SMTP Settings**.

El enlace del correo hay que abrirlo en el mismo navegador en el que se pidió, y deja de valer pasado un tiempo.

## Roles

| | Monitor | Administrador |
|---|---|---|
| Clientes, rutinas y biblioteca de ejercicios | Sí | Sí |
| Eliminar un cliente (se lleva sus notas) | No: lo archiva | Sí |
| Leer todas las notas internas | Sí | Sí |
| Escribir notas firmadas por uno mismo | Sí | Sí |
| Editar o borrar notas | Solo las suyas | Todas |
| Su propio nombre y color (Mi perfil), sin repetir el nombre de otro | Sí | Sí |
| Marca, equipo, copias de seguridad, restablecer datos | No | Sí |

Nadie puede cambiar su propio rol, desactivarse ni borrarse, y siempre queda al menos un administrador activo que ya haya entrado.
Estas reglas las aplica la base de datos, no solo la pantalla: las pruebas de `supabase/schema.test.ts` lo comprueban.

## Las pantallas del gimnasio

Las ventanas de las teles comparten la sesión del navegador y solo reciben los datos que se pueden
ver en público: nunca notas, objetivos ni comentarios internos. Si se cierra la sesión, muestran
«Inicia sesión» y se borra su copia.

**Deja abierto el panel en ese ordenador.** Es el que recibe los cambios que se hacen desde otros
dispositivos y los pasa a las teles. Si se cierra, las teles siguen mostrando lo último que recibieron,
sin actualizarse.

## Antes de usar datos reales

Esto es una demo. **Mientras lo sea, no metas datos reales de clientes**, y menos de salud (lesiones,
molestias): en Europa son datos de categoría especial según el RGPD. Antes de usarla de verdad:

- Proyecto de Supabase en región de la UE (Frankfurt), como en el paso 1.
- Acepta el acuerdo de tratamiento de datos (DPA) de Supabase y el de Vercel: los dos se piden desde su panel.
- Actualiza el registro de actividades y la información que das a los clientes, y pide su consentimiento
  explícito para los datos de salud. Consúltalo con quien os lleve la protección de datos.
- Revisa que el plan de Supabase incluya las copias de seguridad que necesitas. Entretanto, descarga
  copias de vez en cuando desde **Ajustes → Datos** (solo administradores) y guárdalas en un sitio seguro:
  contienen datos privados.
- Da de baja en **Ajustes → Equipo** a quien deje de trabajar en el gimnasio.
- En el ordenador compartido, cierra sesión al acabar si no vas a dejar las teles funcionando.

Antes de abrirlo a más gente, comprueba en el proyecto real, con una cuenta nueva que no esté en Equipo, que
no ve ningún dato. Esto no se puede probar sin un proyecto de Supabase: ver la lista al final de [ARCHITECTURE.md](./ARCHITECTURE.md).

La arquitectura y las normas de código están en [ARCHITECTURE.md](./ARCHITECTURE.md).
