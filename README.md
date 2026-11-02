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

Sin configurar nada, arranca en **Modo local de pruebas**: entras con los botones «Entrar como
administrador» o «Entrar como monitor», sin contraseña, y los datos se quedan solo en ese navegador.
En cuanto configuras la conexión (más abajo), ese modo desaparece por completo.

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

1. Abre `supabase/schema.sql` y, **al final del archivo**, cambia `TU_EMAIL@ejemplo.com` por tu email.
   Ese será el primer administrador.
2. En Supabase ve a **SQL Editor → New query**, pega el archivo entero y pulsa **Run**.

Se puede volver a ejecutar sin romper nada. Si lo ejecutas con otro email, añade otro administrador.

No subas al repositorio el archivo con tu email: cámbialo solo para pegarlo en Supabase.

### 3. Direcciones permitidas

En **Authentication → URL Configuration**:

- **Site URL**: la dirección de tu web, por ejemplo `https://performance33.vercel.app`.
- **Redirect URLs**: añade esa misma dirección y, para probar en local, `http://localhost:5173`.

### 4. Comprobar la confirmación de email (importante)

En **Authentication → Sign In / Providers → Email**, deja **Confirm email** activado (viene así).

La lista de acceso se fía de que el email de cada cuenta esté verificado. Si lo desactivas, cualquiera
podría registrarse con el email de un monitor que aún no haya entrado y ocupar su sitio.

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

Si solo pones una de las dos variables, la web muestra un aviso y no arranca. Si no pones ninguna,
arranca en Modo local de pruebas, con datos solo en cada navegador.

Para usar la nube desde tu ordenador, copia `.env.example` como `.env.local` y rellénalo.

### 7. Primer acceso

1. Entra con Google usando el email que pusiste en el paso 2.
2. Si la base de datos está vacía, verás **Cargar datos de demostración**. Es opcional.
3. En **Ajustes → Equipo**, añade a cada monitor con su email, su nombre y su rol.

## Cómo entra cada persona

Nadie puede registrarse por su cuenta: solo entra quien esté activo en **Ajustes → Equipo**. Cualquier
otra cuenta ve «Tu cuenta no tiene acceso» y ningún dato.

- **Con Google**: basta con que el administrador añada su email en Equipo. Es lo más sencillo.
- **Con email y contraseña**: además de añadirla en Equipo, el administrador crea la cuenta en Supabase:
  **Authentication → Users → Add user → Create new user**, con ese mismo email, una contraseña y
  **Auto Confirm User** activado. Después la persona puede cambiarla desde «He olvidado mi contraseña».

## Correos de contraseña

El correo que trae Supabase de serie es solo para probar: **solo envía a direcciones de tu equipo**
(las que estén en la organización de Supabase) y muy pocos mensajes por hora. Para que «He olvidado mi
contraseña» funcione con cualquier monitor, configura un proveedor propio en **Authentication → Emails → SMTP Settings**.

El enlace del correo hay que abrirlo en el mismo navegador en el que se pidió, y caduca pasado un tiempo.

## Roles

| | Monitor | Administrador |
|---|---|---|
| Clientes, rutinas y biblioteca de ejercicios | Sí | Sí |
| Leer todas las notas internas | Sí | Sí |
| Escribir notas firmadas por uno mismo | Sí | Sí |
| Editar o borrar notas | Solo las suyas | Todas |
| Su propio nombre y color (Mi perfil) | Sí | Sí |
| Marca, equipo, copias de seguridad, restablecer datos | No | Sí |

Nadie puede cambiar su propio rol ni desactivarse, y siempre queda al menos un administrador activo.
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

La arquitectura y las normas de código están en [ARCHITECTURE.md](./ARCHITECTURE.md).
