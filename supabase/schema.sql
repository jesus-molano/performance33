-- Performance33 · Rutinas: base de datos, permisos y tiempo real.
-- Ejecútalo en el SQL Editor de Supabase. Se puede repetir sin romper nada, pero solo sobre esta misma versión.
-- La primera cuenta de administrador se crea aparte, como explica el README.md.

-- La versión anterior tenía otra tabla de cuentas: encima de ella este archivo dejaría una mezcla insegura.
do $$
begin
  if to_regclass('public.staff') is not null then
    raise exception 'Este proyecto tiene la versión anterior (tabla staff). Sigue el paso 2 del README.md antes de ejecutar este archivo.';
  end if;
end;
$$;

-- ── Tablas ──────────────────────────────────────────────────────────────────

-- Una fila por persona con cuenta. Las cuentas las crea el administrador (función admin-users) y el rol
-- decide qué puede hacer cada una. Para añadir un rol: amplía el check, is_active_staff y lo que le toque.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  -- Vacío en las cuentas sin email: su dirección interna (.invalid) solo existe en auth.users.
  email text unique check (email = lower(email)),
  -- Sin espacios invisibles ni caracteres de control: en una firma se verían igual que otro nombre.
  name text not null check (
    char_length(name) <= 30
    and trim(name) <> ''
    and name !~ '[[:cntrl:]\u00A0\u00AD\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]'
  ),
  color text not null default '#d6449a' check (color ~ '^#[0-9a-fA-F]{6}$'),
  role text not null default 'monitor' check (role in ('admin', 'monitor')),
  active boolean not null default true,
  must_change_password boolean not null default false,
  -- La contraseña temporal vigente (su hash): así se sabe si de verdad la ha cambiado. Nadie la lee desde la app.
  temp_password_hash text,
  -- Pasado este momento la contraseña temporal ya no sirve para crear la definitiva: hace falta otra.
  temp_password_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Las notas firman con el nombre y el color: nadie puede ponerse el nombre de otro.
create unique index if not exists profiles_name_unique on public.profiles (lower(trim(name))) where trim(name) <> '';

-- Intentos de entrar con usuario: por persona y conexión, por persona y por conexión (ver login_reserve_attempt).
-- El límite de intentos del servidor de acceso solo vería la IP de la función.
create table if not exists public.login_attempts (
  key text primary key,
  failures integer not null default 1,
  first_failed_at timestamptz not null default now()
);

-- Una fila por entidad; `data` guarda el objeto de la app tal cual. `client_origin` identifica la
-- ventana que escribió (para ignorar el eco de sus propios cambios en tiempo real).
create table if not exists public.clients (
  id text primary key,
  data jsonb not null check (data ? 'firstName'),
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.programs (
  id text primary key,
  data jsonb not null check (data ? 'clientId'),
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.library_exercises (
  id text primary key,
  data jsonb not null check (data ? 'name'),
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- Al borrar un cliente sus notas se borran con él, sean de quien sean: una nota de salud no debe
-- quedar huérfana. Por eso solo el administrador puede borrar clientes (ver los permisos más abajo).
create table if not exists public.notes (
  id text primary key,
  data jsonb not null,
  author_profile_id uuid references public.profiles (id) on delete set null,
  client_id text not null references public.clients (id) on delete cascade,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create index if not exists notes_client_id_idx on public.notes (client_id);

-- Una sola fila: la marca del gimnasio, y cuándo se cargó la biblioteca inicial (solo una vez, aunque luego se vacíe).
create table if not exists public.settings (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null,
  library_seeded_at timestamptz,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- Las teles de la sala (Pantalla 1, 2… hasta 8): nombre y cuántas secciones tiene, de 1 a 6.
-- Sus reglas van aparte, más abajo, para que al repetir el archivo también se actualicen.
create table if not exists public.screens (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- Qué se ve en cada sección ('pantalla:sección'): un usuario (o nadie) y el día de su rutina. Nada más, nada privado.
-- Una fila por sección: dos monitores que mandan a la vez a secciones distintas no se pisan.
create table if not exists public.screen_sections (
  id text primary key,
  screen_id text not null references public.screens (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create index if not exists screen_sections_screen_id_idx on public.screen_sections (screen_id);

-- Reglas de las teles. Se borran y se vuelven a poner en cada ejecución, así un cambio aquí llega también a un
-- proyecto que ya tiene las tablas. Los límites son los de src/config/app.ts (TV_MAX_SCREENS = 8,
-- TV_MIN_SECTIONS..TV_MAX_SECTIONS = 1..6, TV_SCREEN_NAME_MAX_LENGTH = 30; schema.test.ts comprueba que coinciden).
-- El id de usuario tiene la forma de los que crea la app, y la hora es una hora ISO (o nada): ni un texto libre cabe.
alter table public.screens drop constraint if exists screens_id_check;
alter table public.screens add constraint screens_id_check check (id ~ '^[1-8]$') not valid;
alter table public.screens drop constraint if exists screens_data_check;
alter table public.screens add constraint screens_data_check check (coalesce(
  data - array['name', 'sections'] = '{}'::jsonb
  and jsonb_typeof(data -> 'name') = 'string' and char_length(btrim(data ->> 'name')) between 1 and 30
  and jsonb_typeof(data -> 'sections') = 'number' and (data ->> 'sections') ~ '^[1-6]$',
  false
)) not valid;
alter table public.screen_sections drop constraint if exists screen_sections_id_check;
alter table public.screen_sections add constraint screen_sections_id_check check (id ~ '^[1-8]:[1-6]$') not valid;
alter table public.screen_sections drop constraint if exists screen_sections_check;
alter table public.screen_sections drop constraint if exists screen_sections_screen_check;
alter table public.screen_sections add constraint screen_sections_screen_check check (split_part(id, ':', 1) = screen_id) not valid;
alter table public.screen_sections drop constraint if exists screen_sections_data_check;
alter table public.screen_sections add constraint screen_sections_data_check check (coalesce(
  data - array['clientId', 'day', 'assignedAt'] = '{}'::jsonb
  and (data -> 'clientId' = 'null'::jsonb or (jsonb_typeof(data -> 'clientId') = 'string' and (data ->> 'clientId') ~ '^[A-Za-z0-9_-]{1,64}$'))
  and jsonb_typeof(data -> 'day') = 'number' and (data ->> 'day') ~ '^[1-9][0-9]?$'
  and jsonb_typeof(data -> 'assignedAt') = 'string'
  and (data ->> 'assignedAt') ~ '^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?Z)?$',
  false
)) not valid;

-- Las filas que ya había se comprueban; si alguna antigua no cumple, se queda (y se avisa), pero ninguna nueva entra.
do $$
declare
  c record;
begin
  for c in
    select conrelid::regclass as tbl, conname from pg_constraint
    where conrelid in ('public.screens'::regclass, 'public.screen_sections'::regclass) and contype = 'c' and not convalidated
  loop
    begin
      execute format('alter table %s validate constraint %I', c.tbl, c.conname);
    exception when check_violation then
      raise notice 'Hay filas antiguas en % que no cumplen %: se quedan, pero las nuevas sí la cumplirán.', c.tbl, c.conname;
    end;
  end loop;
end;
$$;

-- Copia de lo que había antes de cada cambio o borrado, para poder deshacer un destrozo desde el SQL Editor (README.md).
-- Nadie la lee desde la app. Las notas no entran: una nota de salud borrada debe desaparecer de verdad.
create table if not exists public.row_history (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text not null,
  operation text not null,
  data jsonb not null,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index if not exists row_history_changed_at_idx on public.row_history (changed_at);
create index if not exists row_history_row_idx on public.row_history (table_name, row_id, changed_at desc);

-- ── Funciones de ayuda para los permisos ───────────────────────────────────

-- Quien entra con la cuenta de Google del email de su ficha no tiene contraseña temporal que cambiar: ese email lo
-- escribió un administrador. Una cuenta de Google conectada a mano no basta, o valdría para saltarse el primer acceso.
create or replace function public.signed_in_with_google()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'amr' @> '[{"method": "oauth"}]'::jsonb or auth.jwt() -> 'amr' @> '["oauth"]'::jsonb, false)
    and exists (
      select 1
      from auth.identities i
      join public.profiles p on p.user_id = i.user_id
      where i.user_id = auth.uid() and i.provider = 'google' and lower(i.identity_data ->> 'email') = p.email
    )
$$;

-- Mientras tenga que cambiar la contraseña temporal, la cuenta no cuenta como equipo: no lee ni escribe nada.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.profiles
  where user_id = auth.uid() and active and (not must_change_password or public.signed_in_with_google())
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = public.current_profile_id() and role in ('admin', 'monitor')
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = public.current_profile_id() and role = 'admin')
$$;

-- La cuenta de quien ha entrado, aunque aún tenga que cambiar la contraseña: nada si no tiene acceso.
drop function if exists public.my_profile();
create function public.my_profile()
returns table (
  id uuid, username text, email text, name text, color text, role text, active boolean, must_change_password boolean,
  has_own_password boolean, temporary_password_expired boolean, google_connected boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.email, p.name, p.color, p.role, p.active,
    p.must_change_password and not public.signed_in_with_google(),
    not p.must_change_password,
    p.must_change_password and p.temp_password_expires_at <= now() and not public.signed_in_with_google(),
    exists (select 1 from auth.identities i where i.user_id = p.user_id and i.provider = 'google')
  from public.profiles p
  where p.user_id = auth.uid() and p.active
$$;

-- Ajustes → Equipo: los datos de acceso de todos, solo para administradores.
drop function if exists public.team_accounts();
create function public.team_accounts()
returns table (
  id uuid, username text, email text, name text, color text, role text, active boolean, must_change_password boolean,
  has_own_password boolean, temporary_password_expired boolean, google_connected boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.email, p.name, p.color, p.role, p.active, p.must_change_password,
    not p.must_change_password,
    p.must_change_password and p.temp_password_expires_at <= now(),
    exists (select 1 from auth.identities i where i.user_id = p.user_id and i.provider = 'google')
  from public.profiles p
  where public.is_admin()
  order by p.name
$$;

-- Termina el primer acceso. Solo funciona si la contraseña ya no es la temporal, y a tiempo: llamarla no basta para saltárselo.
create or replace function public.finish_password_change()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
  set must_change_password = false
  where p.user_id = auth.uid()
    and p.active
    and p.must_change_password
    and p.temp_password_hash is distinct from (select u.encrypted_password from auth.users u where u.id = auth.uid())
    and (p.temp_password_expires_at > now() or public.signed_in_with_google());
  if not found then
    raise exception 'password_not_changed' using errcode = 'P0001';
  end if;
end;
$$;

-- La biblioteca inicial se sube una sola vez, en la primera sesión de un administrador.
create or replace function public.library_seed_pending()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    and not exists (select 1 from public.settings where library_seeded_at is not null)
$$;

-- Toda la carga en una sola operación: o entra entera o no entra, y dos administradores a la vez no se pisan.
-- Devuelve false si ya estaba hecha, así lo que alguien haya borrado después no vuelve.
create or replace function public.seed_library(p_rows jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('public.library_exercises.seed'));
  if exists (select 1 from public.settings where library_seeded_at is not null) then
    return false;
  end if;
  insert into public.library_exercises (id, data, client_origin)
  select r ->> 'id', r -> 'data', r ->> 'client_origin' from jsonb_array_elements(p_rows) as r
  on conflict (id) do nothing;
  insert into public.settings (id, data, library_seeded_at) values ('main', '{}', now())
  on conflict (id) do update set library_seeded_at = now();
  return true;
end;
$$;

-- Cierra las sesiones de una cuenta (nueva contraseña temporal, desactivada). Solo la función admin-users.
create or replace function public.revoke_user_sessions(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.sessions where user_id = target;
  delete from auth.refresh_tokens where user_id = target::text;
end;
$$;

-- Una cuenta de Google conectada a mano no sobrevive a una contraseña nueva: quizá la puso quien tenía acceso a la
-- sesión. La del email de su ficha se queda, porque ese email lo escribió un administrador. Solo la función admin-users.
create or replace function public.remove_other_google_identities(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.identities i
  where i.user_id = target
    and i.provider = 'google'
    and lower(i.identity_data ->> 'email') is distinct from (select p.email from public.profiles p where p.user_id = target);
end;
$$;

-- Límite de intentos: cada uno se aparta ANTES de mirar la contraseña, así varias peticiones a la vez no se cuelan.
-- En 15 minutos: 5 por persona y conexión, 20 por persona desde cualquier conexión y 50 por conexión a cualquier persona.
-- Un extraño solo gasta su propio cupo: para dejar fuera a un monitor necesitaría 20 intentos desde más de 4 conexiones.
create or replace function public.login_count_attempt(p_key text, p_limit integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  insert into public.login_attempts (key) values (p_key)
  on conflict (key) do update set failures = public.login_attempts.failures + 1
  returning failures <= p_limit
$$;

create or replace function public.login_reserve_attempt(p_username text, p_client text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  pair_allowed boolean;
  name_allowed boolean;
begin
  delete from public.login_attempts where first_failed_at <= now() - interval '15 minutes';
  if not public.login_count_attempt('client:' || p_client, 50) then
    return false;
  end if;
  pair_allowed := public.login_count_attempt('pair:' || p_client || ':' || p_username, 5);
  name_allowed := public.login_count_attempt('name:' || p_username, 20);
  return pair_allowed and name_allowed;
end;
$$;

-- El servidor falló y no se llegó a probar la contraseña: no cuenta.
create or replace function public.login_release_attempt(p_username text, p_client text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.login_attempts set failures = failures - 1
  where key in ('client:' || p_client, 'pair:' || p_client || ':' || p_username, 'name:' || p_username)
$$;

-- Ha entrado: borra lo suyo y devuelve el intento a su conexión.
create or replace function public.login_clear_failures(p_username text, p_client text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.login_attempts where key in ('pair:' || p_client || ':' || p_username, 'name:' || p_username);
  update public.login_attempts set failures = failures - 1 where key = 'client:' || p_client;
$$;

-- Una contraseña nueva o reactivar la cuenta desbloquea a esa persona, venga de donde venga.
create or replace function public.login_clear_username(p_username text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.login_attempts
  where key = 'name:' || p_username or (key like 'pair:%' and right(key, char_length(p_username) + 1) = ':' || p_username)
$$;

revoke all on function public.signed_in_with_google() from public, anon, authenticated;
revoke all on function public.current_profile_id() from public, anon;
revoke all on function public.is_active_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.my_profile() from public, anon;
revoke all on function public.team_accounts() from public, anon;
revoke all on function public.finish_password_change() from public, anon;
revoke all on function public.library_seed_pending() from public, anon;
revoke all on function public.seed_library(jsonb) from public, anon;
revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
revoke all on function public.remove_other_google_identities(uuid) from public, anon, authenticated;
revoke all on function public.login_count_attempt(text, integer) from public, anon, authenticated;
revoke all on function public.login_reserve_attempt(text, text) from public, anon, authenticated;
revoke all on function public.login_release_attempt(text, text) from public, anon, authenticated;
revoke all on function public.login_clear_failures(text, text) from public, anon, authenticated;
revoke all on function public.login_clear_username(text) from public, anon, authenticated;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.team_accounts() to authenticated;
grant execute on function public.finish_password_change() to authenticated;
grant execute on function public.library_seed_pending() to authenticated;
grant execute on function public.seed_library(jsonb) to authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
grant execute on function public.remove_other_google_identities(uuid) to service_role;
grant execute on function public.login_reserve_attempt(text, text) to service_role;
grant execute on function public.login_release_attempt(text, text) to service_role;
grant execute on function public.login_clear_failures(text, text) to service_role;
grant execute on function public.login_clear_username(text) to service_role;

-- ── Reglas de las cuentas (triggers) ────────────────────────────────────────

create or replace function public.profiles_normalize()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.username := lower(trim(new.username));
  new.email := nullif(lower(trim(new.email)), '');
  return new;
end;
$$;

-- Cada vez que se marca el cambio obligatorio se apunta la contraseña que hay en ese momento: por eso la
-- función admin-users cambia primero la contraseña y después la marca.
create or replace function public.profiles_remember_temp_password()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.temp_password_hash := case
    when new.must_change_password then (select u.encrypted_password from auth.users u where u.id = new.user_id)
  end;
  new.temp_password_expires_at := case when new.must_change_password then now() + interval '72 hours' end;
  return new;
end;
$$;

-- Siempre tiene que quedar un administrador activo. El bloqueo evita que dos admins se quiten a la vez.
create or replace function public.profiles_keep_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.active
    and (tg_op = 'DELETE' or new.role <> 'admin' or not new.active) then
    perform pg_advisory_xact_lock(hashtext('public.profiles.admins'));
    if not exists (select 1 from public.profiles where id <> old.id and active and role = 'admin') then
      raise exception 'profile_last_admin' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_normalize on public.profiles;
create trigger profiles_normalize before insert or update of email, username on public.profiles
  for each row execute function public.profiles_normalize();

drop trigger if exists profiles_remember_temp_password on public.profiles;
create trigger profiles_remember_temp_password before insert or update of must_change_password on public.profiles
  for each row execute function public.profiles_remember_temp_password();

drop trigger if exists profiles_keep_last_admin on public.profiles;
create trigger profiles_keep_last_admin before update or delete on public.profiles
  for each row execute function public.profiles_keep_last_admin();

-- Fecha y autor los pone siempre el servidor (no se pueden falsificar desde el navegador).
create or replace function public.stamp_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := public.current_profile_id();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['clients', 'programs', 'library_exercises', 'notes', 'settings', 'screens', 'screen_sections'] loop
    execute format('drop trigger if exists stamp_row on public.%I', t);
    execute format('create trigger stamp_row before insert or update on public.%I for each row execute function public.stamp_row()', t);
  end loop;
end;
$$;

-- Una tele con otro número de secciones: las que quedan fuera, o las que vuelven a aparecer, empiezan vacías.
-- En el mismo cambio, así nunca reaparece alguien que estaba en una sección escondida.
create or replace function public.trim_screen_sections()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.data ->> 'sections') is distinct from (old.data ->> 'sections') then
    delete from public.screen_sections
    where screen_id = new.id
      and split_part(id, ':', 2)::int > least((old.data ->> 'sections')::int, (new.data ->> 'sections')::int);
  end if;
  return null;
end;
$$;

drop trigger if exists trim_screen_sections on public.screens;
create trigger trim_screen_sections after update on public.screens for each row execute function public.trim_screen_sections();

-- Antes de cambiar o borrar, una copia. Lo de más de 30 días se va solo.
create or replace function public.keep_row_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.data is not distinct from new.data then
    return null;
  end if;
  insert into public.row_history (table_name, row_id, operation, data, changed_by)
  values (tg_table_name, old.id, tg_op, old.data, public.current_profile_id());
  delete from public.row_history where changed_at < now() - interval '30 days';
  return null;
end;
$$;

revoke all on function public.keep_row_history() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['clients', 'programs', 'library_exercises'] loop
    execute format('drop trigger if exists keep_row_history on public.%I', t);
    execute format('create trigger keep_row_history after update or delete on public.%I for each row execute function public.keep_row_history()', t);
  end loop;
end;
$$;

-- ── Permisos por fila (RLS) ─────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.login_attempts enable row level security;
alter table public.row_history enable row level security;
alter table public.clients enable row level security;
alter table public.programs enable row level security;
alter table public.library_exercises enable row level security;
alter table public.notes enable row level security;
alter table public.settings enable row level security;
alter table public.screens enable row level security;
alter table public.screen_sections enable row level security;

revoke all on public.row_history from public, anon, authenticated;
revoke all on public.profiles, public.login_attempts, public.clients, public.programs, public.library_exercises, public.notes, public.settings from anon, authenticated;
revoke all on public.screens, public.screen_sections from public, anon, authenticated;
grant select, insert, update, delete
  on public.clients, public.programs, public.library_exercises, public.notes, public.settings, public.screens, public.screen_sections
  to authenticated;
grant all on public.profiles, public.login_attempts to service_role;

-- El equipo ve de los demás solo lo que firma una nota. Cada uno cambia su nombre y su color; lo demás
-- (altas, bajas, roles) pasa por la función admin-users. Email y usuario se leen con my_profile y team_accounts.
grant select (id, name, color, role, active) on public.profiles to authenticated;
grant update (name, color) on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (public.is_active_staff());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = public.current_profile_id())
  with check (id = public.current_profile_id());

-- Rutinas, biblioteca y lo que se ve en las teles: todo el equipo activo.
do $$
declare
  t text;
begin
  foreach t in array array['programs', 'library_exercises', 'screens', 'screen_sections'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_active_staff()) with check (public.is_active_staff())',
      t || '_all', t
    );
  end loop;
end;
$$;

-- Clientes: todo el equipo; borrarlos, solo el admin, porque se llevan las notas de todos. Los monitores archivan.
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated using (public.is_active_staff());
drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert to authenticated with check (public.is_active_staff());
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete to authenticated using (public.is_admin());

-- Notas: las lee todo el equipo; cada uno crea, edita y borra las suyas. El admin también puede actuar
-- sobre las de otros: lo necesita para restaurar una copia con sus firmas originales.
drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes for select to authenticated using (public.is_active_staff());
drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes for insert to authenticated
  with check (public.is_admin() or (public.is_active_staff() and author_profile_id = public.current_profile_id()));
drop policy if exists notes_update on public.notes;
create policy notes_update on public.notes for update to authenticated
  using (public.is_admin() or (public.is_active_staff() and author_profile_id = public.current_profile_id()))
  with check (public.is_admin() or (public.is_active_staff() and author_profile_id = public.current_profile_id()));
drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes for delete to authenticated
  using (public.is_admin() or (public.is_active_staff() and author_profile_id = public.current_profile_id()));

-- Marca: la lee el equipo, la cambia el admin.
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select to authenticated using (public.is_active_staff());
drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings for insert to authenticated with check (public.is_admin());
drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists settings_delete on public.settings;
create policy settings_delete on public.settings for delete to authenticated using (public.is_admin());

-- ── Clases y reservas ───────────────────────────────────────────────────────
-- El horario semanal (class_templates) genera las clases concretas (class_slots), y en ellas se reserva (bookings).
-- Las reglas están en booking_settings. Nadie escribe en class_slots ni en bookings: solo las funciones de aquí.
-- Las horas son siempre las del gimnasio, 'Atlantic/Canary' (GYM_TIME_ZONE en shared/booking/constants.ts).
-- Los límites son los de BOOKING_LIMITS, los valores iniciales los de BOOKING_DEFAULTS y los errores los códigos de
-- shared/booking/errors.ts: schema.test.ts comprueba que coinciden. Como las teles, no entran en el historial de cambios.
-- Bloqueos, siempre en este orden para que dos peticiones a la vez no se esperen en círculo: primero la ficha del
-- usuario (clients) y después la clase o clases (por id), con FOR UPDATE.

-- Una sola fila. Cada plan tiene una regla: 'fixed' (el número de al lado), 'unlimited' o 'training_days' (los de su ficha).
create table if not exists public.booking_settings (
  id text primary key default 'main' check (id = 'main'),
  quota_standard_rule text not null default 'fixed',
  quota_standard integer default 2,
  quota_plus_rule text not null default 'fixed',
  quota_plus integer default 3,
  quota_elite_rule text not null default 'unlimited',
  quota_elite integer,
  quota_custom_rule text not null default 'training_days',
  quota_custom integer,
  horizon_days integer not null default 14,
  cancel_until_minutes integer not null default 120,
  late_cancel_counts boolean not null default true,
  waitlist_enabled boolean not null default true,
  promote_until_minutes integer not null default 30,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.booking_settings (id) values ('main') on conflict (id) do nothing;

-- El horario de cada semana: día (1 lunes … 7 domingo), hora, duración, plazas y nombre.
create table if not exists public.class_templates (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null,
  start_time time not null,
  duration_minutes integer not null,
  capacity integer not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- Las clases de cada día. Las del horario llevan su plantilla y el día para el que se crearon (template_date), que no
-- cambia aunque un monitor mueva la clase: así nunca se crea otra igual. `edited`: un monitor la cambió a mano.
create table if not exists public.class_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.class_templates (id) on delete set null,
  template_date date,
  starts_at timestamptz not null,
  gym_date date generated always as ((starts_at at time zone 'Atlantic/Canary')::date) stored,
  duration_minutes integer not null,
  capacity integer not null,
  name text not null,
  status text not null default 'open',
  edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  unique (template_id, template_date)
);

create index if not exists class_slots_gym_date_idx on public.class_slots (gym_date, starts_at);

-- Una fila por reserva; las anuladas se quedan (una cancelación tarde cuenta en la semana). `queue_order` es el orden de
-- llegada, el de la lista de espera. `forced`: el monitor la metió por encima del aforo. `moved_to`: la reserva de la otra clase.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.class_slots (id) on delete cascade,
  client_id text not null references public.clients (id) on delete cascade,
  status text not null,
  forced boolean not null default false,
  added_by uuid references public.profiles (id) on delete set null,
  moved_to uuid references public.bookings (id) on delete set null,
  queue_order bigint generated always as identity,
  created_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- Nunca dos reservas vivas (con plaza o en espera) de la misma persona en la misma clase, ni a la vez.
create unique index if not exists bookings_one_active_idx on public.bookings (slot_id, client_id) where status in ('booked', 'waitlisted');
create index if not exists bookings_slot_idx on public.bookings (slot_id, status, queue_order);
create index if not exists bookings_client_idx on public.bookings (client_id, status);

-- Avisos pendientes para los usuarios (se envían en la fase 5). Solo ids: nada privado. Nadie los lee desde la app.
create table if not exists public.notification_outbox (
  id bigint generated always as identity primary key,
  kind text not null,
  client_id text not null references public.clients (id) on delete cascade,
  slot_id uuid references public.class_slots (id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_outbox_pending_idx on public.notification_outbox (created_at) where sent_at is null;

-- Reglas, reaplicables como las de las teles. Límites de BOOKING_LIMITS (shared/booking/constants.ts):
-- clases por semana 1..7, reservar con 1..60 días, cancelar 0..2880 min antes, espera hasta 0..1440 min antes,
-- plazas 1..100, duración 15..240 min, nombre de 1 a 40 letras. Horas en minutos justos.
alter table public.booking_settings drop constraint if exists booking_settings_quota_check;
alter table public.booking_settings add constraint booking_settings_quota_check check (coalesce(
  quota_standard_rule in ('fixed', 'unlimited', 'training_days') and (quota_standard_rule = 'fixed') = (quota_standard is not null)
  and quota_plus_rule in ('fixed', 'unlimited', 'training_days') and (quota_plus_rule = 'fixed') = (quota_plus is not null)
  and quota_elite_rule in ('fixed', 'unlimited', 'training_days') and (quota_elite_rule = 'fixed') = (quota_elite is not null)
  and quota_custom_rule in ('fixed', 'unlimited', 'training_days') and (quota_custom_rule = 'fixed') = (quota_custom is not null)
  and coalesce(quota_standard, 1) between 1 and 7 and coalesce(quota_plus, 1) between 1 and 7
  and coalesce(quota_elite, 1) between 1 and 7 and coalesce(quota_custom, 1) between 1 and 7,
  false
)) not valid;
alter table public.booking_settings drop constraint if exists booking_settings_times_check;
alter table public.booking_settings add constraint booking_settings_times_check check (
  horizon_days between 1 and 60
  and cancel_until_minutes between 0 and 2880
  and promote_until_minutes between 0 and 1440
) not valid;

alter table public.class_templates drop constraint if exists class_templates_check;
alter table public.class_templates add constraint class_templates_check check (coalesce(
  weekday between 1 and 7
  and extract(second from start_time) = 0
  and duration_minutes between 15 and 240
  and capacity between 1 and 100
  and name = btrim(name) and char_length(name) between 1 and 40
  and name !~ '[[:cntrl:] ­​-‏ - ⁠-⁯﻿]',
  false
)) not valid;

alter table public.class_slots drop constraint if exists class_slots_check;
alter table public.class_slots add constraint class_slots_check check (coalesce(
  status in ('open', 'closed', 'cancelled')
  and (template_id is null or template_date is not null)
  and extract(second from starts_at) = 0
  and duration_minutes between 15 and 240
  and capacity between 1 and 100
  and name = btrim(name) and char_length(name) between 1 and 40
  and name !~ '[[:cntrl:] ­​-‏ - ⁠-⁯﻿]',
  false
)) not valid;

alter table public.bookings drop constraint if exists bookings_check;
alter table public.bookings add constraint bookings_check check (coalesce(
  status in ('booked', 'waitlisted', 'cancelled', 'late_cancelled', 'removed', 'slot_cancelled')
  and not (forced and status = 'waitlisted'),
  false
)) not valid;

alter table public.notification_outbox drop constraint if exists notification_outbox_kind_check;
alter table public.notification_outbox add constraint notification_outbox_kind_check check (
  kind in ('promoted', 'slot_cancelled', 'slot_changed', 'moved', 'removed')
) not valid;

do $$
declare
  c record;
begin
  for c in
    select conrelid::regclass as tbl, conname from pg_constraint
    where conrelid in (
      'public.booking_settings'::regclass, 'public.class_templates'::regclass, 'public.class_slots'::regclass,
      'public.bookings'::regclass, 'public.notification_outbox'::regclass
    ) and contype = 'c' and not convalidated
  loop
    begin
      execute format('alter table %s validate constraint %I', c.tbl, c.conname);
    exception when check_violation then
      raise notice 'Hay filas antiguas en % que no cumplen %: se quedan, pero las nuevas sí la cumplirán.', c.tbl, c.conname;
    end;
  end loop;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['booking_settings', 'class_templates', 'class_slots', 'bookings'] loop
    execute format('drop trigger if exists stamp_row on public.%I', t);
    execute format('create trigger stamp_row before insert or update on public.%I for each row execute function public.stamp_row()', t);
  end loop;
end;
$$;

-- ── Clases y reservas: funciones internas (sin acceso desde la app) ─────────

-- Una hora del reloj del gimnasio → un momento. Igual que gymTimeToMs (shared/booking/week.ts): cuando la hora se repite
-- (octubre) gana la primera; cuando no existe (marzo) pasa a la hora siguiente, como el reloj.
create or replace function public.gym_time_to_instant(p_date date, p_time time)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select case
    when ((p_date + p_time - interval '1 hour') at time zone 'UTC') at time zone 'Atlantic/Canary' = p_date + p_time
      then (p_date + p_time - interval '1 hour') at time zone 'UTC'
    else (p_date + p_time) at time zone 'UTC'
  end
$$;

create or replace function public.gym_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Atlantic/Canary')::date
$$;

-- El lunes de la semana del gimnasio de ese día (la semana va de lunes 00:00 a lunes 00:00, hora de Canarias).
create or replace function public.gym_week_start(p_day date)
returns date
language sql
immutable
set search_path = ''
as $$
  select date_trunc('week', p_day::timestamp)::date
$$;

-- Las reglas vigentes. Si alguien borró la fila desde el SQL Editor, vuelve con los valores iniciales.
create or replace function public.booking_rules()
returns public.booking_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.booking_settings;
begin
  select * into r from public.booking_settings where id = 'main';
  if not found then
    insert into public.booking_settings (id) values ('main') on conflict (id) do nothing;
    select * into r from public.booking_settings where id = 'main';
  end if;
  return r;
end;
$$;

-- Clases por semana de esa persona según su plan (null = sin límite). Como weeklyQuotaFor en shared/booking/quota.ts.
create or replace function public.weekly_quota(p_client_id text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.booking_settings := public.booking_rules();
  v_plan text;
  v_days integer;
  v_rule text;
  v_classes integer;
begin
  select coalesce(c.data ->> 'plan', 'standard'),
    case when jsonb_typeof(c.data -> 'trainingDays') = 'number' then least(7, greatest(0, floor((c.data ->> 'trainingDays')::numeric)))::integer else 0 end
  into v_plan, v_days
  from public.clients c where c.id = p_client_id;
  case v_plan
    when 'plus' then v_rule := r.quota_plus_rule; v_classes := r.quota_plus;
    when 'elite' then v_rule := r.quota_elite_rule; v_classes := r.quota_elite;
    when 'custom' then v_rule := r.quota_custom_rule; v_classes := r.quota_custom;
    else v_rule := r.quota_standard_rule; v_classes := r.quota_standard;
  end case;
  return case v_rule when 'unlimited' then null when 'training_days' then coalesce(v_days, 0) else v_classes end;
end;
$$;

-- Clases usadas en la semana de ese día: las que tienen plaza y, si cuentan, las canceladas tarde. La espera y las
-- clases que cancela el gimnasio no cuentan.
create or replace function public.week_usage(p_client_id text, p_day date)
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.bookings b
  join public.class_slots s on s.id = b.slot_id
  where b.client_id = p_client_id
    and s.gym_date >= public.gym_week_start(p_day)
    and s.gym_date < public.gym_week_start(p_day) + 7
    and s.status <> 'cancelled'
    and (b.status = 'booked' or (b.status = 'late_cancelled' and (public.booking_rules()).late_cancel_counts))
$$;

create or replace function public.slot_booked_count(p_slot_id uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(*)::integer from public.bookings b where b.slot_id = p_slot_id and b.status = 'booked'
$$;

-- Deja un aviso para el usuario. Lo de más de 30 días se va solo.
create or replace function public.enqueue_notification(p_kind text, p_client_id text, p_slot_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notification_outbox (kind, client_id, slot_id) values (p_kind, p_client_id, p_slot_id);
  delete from public.notification_outbox where created_at < now() - interval '30 days';
$$;

-- Crea las clases del horario de esos días que aún no existan (nunca dos de la misma plantilla y día), solo las que
-- todavía no han empezado. Se puede llamar las veces que haga falta. Sin cron: la llaman las funciones que leen clases.
create or replace function public.ensure_class_slots(p_from date, p_to date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_created integer;
begin
  insert into public.class_slots (template_id, template_date, starts_at, duration_minutes, capacity, name)
  select t.id, d.day, public.gym_time_to_instant(d.day, t.start_time), t.duration_minutes, t.capacity, t.name
  from public.class_templates t
  cross join lateral (select g::date as day from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') g) d
  where t.active
    and extract(isodow from d.day) = t.weekday
    and public.gym_time_to_instant(d.day, t.start_time) > now()
  on conflict (template_id, template_date) do nothing;
  get diagnostics v_created = row_count;
  return v_created;
end;
$$;

-- La clase, bloqueada, para una acción de monitor: tiene que existir, no estar cancelada ni haber terminado.
create or replace function public.lock_slot_for_staff(p_slot_id uuid)
returns public.class_slots
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.class_slots;
begin
  select * into s from public.class_slots where id = p_slot_id for update;
  if not found then
    raise exception 'slot_not_found' using errcode = 'P0001';
  end if;
  if s.status = 'cancelled' then
    raise exception 'slot_cancelled' using errcode = 'P0001';
  end if;
  if s.starts_at + make_interval(mins => s.duration_minutes) <= now() then
    raise exception 'slot_finished' using errcode = 'P0001';
  end if;
  return s;
end;
$$;

create or replace function public.require_staff()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_staff() then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
end;
$$;

-- Si hay sitio, entran los primeros de la espera que aún tengan clases esa semana. Quien llama ya tiene bloqueada la
-- clase. Para no saltarse el orden de bloqueos (ficha y después clase) no espera por ninguna ficha: SKIP LOCKED salta a
-- quien en ese momento está reservando otra cosa, que sigue el primero para la próxima plaza.
-- Solo en clases abiertas y hasta promote_until_minutes antes de empezar.
create or replace function public.promote_waitlist(p_slot_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.class_slots;
  r public.booking_settings := public.booking_rules();
  w record;
  v_free integer;
  v_quota integer;
  v_promoted integer := 0;
begin
  select * into s from public.class_slots where id = p_slot_id;
  if not found or s.status <> 'open' or not r.waitlist_enabled
    or now() >= s.starts_at - make_interval(mins => r.promote_until_minutes) then
    return 0;
  end if;
  v_free := s.capacity - public.slot_booked_count(p_slot_id);
  if v_free <= 0 then
    return 0;
  end if;
  for w in
    select b.id, b.client_id from public.bookings b
    where b.slot_id = p_slot_id and b.status = 'waitlisted'
    order by b.queue_order
    for update skip locked
  loop
    exit when v_free <= 0;
    perform 1 from public.clients c where c.id = w.client_id for update skip locked;
    continue when not found;
    v_quota := public.weekly_quota(w.client_id);
    continue when v_quota is not null and public.week_usage(w.client_id, s.gym_date) >= v_quota;
    update public.bookings set status = 'booked', status_changed_at = now() where id = w.id;
    perform public.enqueue_notification('promoted', w.client_id, p_slot_id);
    v_promoted := v_promoted + 1;
    v_free := v_free - 1;
  end loop;
  return v_promoted;
end;
$$;

-- Un cambio en el horario rehace sus clases futuras que nadie ha tocado a mano y no tienen a nadie apuntado (ni una
-- cancelación tarde, que cuenta en la semana). Las que tienen gente se quedan como estaban: el monitor decide.
create or replace function public.class_templates_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (old.weekday, old.start_time, old.duration_minutes, old.capacity, old.name, old.active)
      is not distinct from (new.weekday, new.start_time, new.duration_minutes, new.capacity, new.name, new.active) then
    return null;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    -- Bloquear antes de mirar: quien apunta a alguien bloquea la clase, así que el delete (otra sentencia, con otra
    -- foto) ve las reservas hechas mientras esperaba y no se lleva por delante una recién confirmada.
    perform 1 from public.class_slots s
    where s.template_id = old.id and not s.edited and s.starts_at > now()
    order by s.id
    for update;
    delete from public.class_slots s
    where s.template_id = old.id
      and not s.edited
      and s.starts_at > now()
      and not exists (
        select 1 from public.bookings b where b.slot_id = s.id and b.status in ('booked', 'waitlisted', 'late_cancelled')
      );
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  perform public.ensure_class_slots(public.gym_today(), public.gym_today() + (public.booking_rules()).horizon_days);
  return null;
end;
$$;

-- Antes de borrar (después, la plantilla ya no estaría en sus clases); al crear o cambiar, después.
drop trigger if exists class_templates_unschedule on public.class_templates;
create trigger class_templates_unschedule before delete on public.class_templates
  for each row execute function public.class_templates_sync();
drop trigger if exists class_templates_sync on public.class_templates;
create trigger class_templates_sync after insert or update on public.class_templates
  for each row execute function public.class_templates_sync();

-- ── Clases y reservas: lo que llama la app ──────────────────────────────────

-- Las clases de esos días (como mucho SLOT_LIST_MAX_DAYS = 42) con sus plazas ocupadas y la espera.
-- Antes crea las del horario que falten, desde hoy y hasta 60 días (el máximo de horizon_days).
drop function if exists public.class_slots_for(date, date);
create function public.class_slots_for(p_from date, p_to date)
returns table (
  id uuid, template_id uuid, starts_at timestamptz, gym_date date, duration_minutes integer, capacity integer,
  name text, status text, edited boolean, booked_count integer, waitlist_count integer, my_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_to date := least(p_to, p_from + 41);
begin
  if not public.is_active_staff() then
    -- Fase 3: aquí irá la vista del usuario (sus propias reservas en my_status, dentro de horizon_days).
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if v_to >= public.gym_today() then
    perform public.ensure_class_slots(greatest(p_from, public.gym_today()), least(v_to, public.gym_today() + 60));
  end if;
  return query
  select s.id, s.template_id, s.starts_at, s.gym_date, s.duration_minutes, s.capacity, s.name, s.status, s.edited,
    (select count(*)::integer from public.bookings b where b.slot_id = s.id and b.status = 'booked'),
    (select count(*)::integer from public.bookings b where b.slot_id = s.id and b.status = 'waitlisted'),
    null::text
  from public.class_slots s
  where s.gym_date between p_from and v_to
  order by s.starts_at, s.id;
end;
$$;

-- El monitor apunta a alguien. Llena: 'slot_full', salvo con p_force (entra por encima del aforo, marcada `forced`).
-- La cuota no lo impide: over_quota avisa de que esa semana ya había usado sus clases.
drop function if exists public.staff_add_booking(uuid, text, boolean);
create function public.staff_add_booking(p_slot_id uuid, p_client_id text, p_force boolean default false)
returns table (booking_id uuid, status text, forced boolean, over_quota boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.class_slots;
  v_forced boolean;
  v_quota integer;
  v_used integer;
  v_id uuid;
begin
  perform public.require_staff();
  perform 1 from public.clients c where c.id = p_client_id for update;
  if not found then
    raise exception 'client_not_found' using errcode = 'P0001';
  end if;
  s := public.lock_slot_for_staff(p_slot_id);
  if exists (
    select 1 from public.bookings b
    where b.slot_id = s.id and b.client_id = p_client_id and b.status in ('booked', 'waitlisted')
  ) then
    raise exception 'already_booked' using errcode = 'P0001';
  end if;
  v_forced := public.slot_booked_count(s.id) >= s.capacity;
  if v_forced and not coalesce(p_force, false) then
    raise exception 'slot_full' using errcode = 'P0001';
  end if;
  v_quota := public.weekly_quota(p_client_id);
  v_used := public.week_usage(p_client_id, s.gym_date);
  insert into public.bookings (slot_id, client_id, status, forced, added_by)
  values (s.id, p_client_id, 'booked', v_forced, public.current_profile_id())
  returning bookings.id into v_id;
  return query select v_id, 'booked'::text, v_forced, v_quota is not null and v_used >= v_quota;
end;
$$;

-- El monitor quita a alguien (con plaza o en espera). Si deja sitio, entra el primero de la espera.
drop function if exists public.staff_remove_booking(uuid);
create function public.staff_remove_booking(p_booking_id uuid)
returns table (booking_id uuid, slot_id uuid, client_id text, previous_status text, promoted integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client text;
  v_slot uuid;
  v_previous text;
  s public.class_slots;
begin
  perform public.require_staff();
  select b.client_id, b.slot_id into v_client, v_slot from public.bookings b where b.id = p_booking_id;
  if not found then
    raise exception 'booking_not_found' using errcode = 'P0001';
  end if;
  perform 1 from public.clients c where c.id = v_client for update;
  s := public.lock_slot_for_staff(v_slot);
  select b.status into v_previous from public.bookings b where b.id = p_booking_id for update;
  if v_previous is null or v_previous not in ('booked', 'waitlisted') then
    raise exception 'booking_not_found' using errcode = 'P0001';
  end if;
  update public.bookings b set status = 'removed', status_changed_at = now() where b.id = p_booking_id;
  perform public.enqueue_notification('removed', v_client, s.id);
  return query select p_booking_id, s.id, v_client, v_previous,
    case when v_previous = 'booked' then public.promote_waitlist(s.id) else 0 end;
end;
$$;

-- El monitor pasa a alguien a otra clase: la reserva de la otra clase es nueva (con plaza) y esta queda 'removed' con
-- `moved_to`. La otra llena: 'slot_full', salvo con p_force. En la clase que deja entra el primero de la espera.
drop function if exists public.staff_move_booking(uuid, uuid, boolean);
create function public.staff_move_booking(p_booking_id uuid, p_to_slot_id uuid, p_force boolean default false)
returns table (booking_id uuid, status text, forced boolean, over_quota boolean, promoted integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client text;
  v_from uuid;
  v_previous text;
  s_from public.class_slots;
  s_to public.class_slots;
  v_forced boolean;
  v_quota integer;
  v_used integer;
  v_id uuid;
begin
  perform public.require_staff();
  select b.client_id, b.slot_id into v_client, v_from from public.bookings b where b.id = p_booking_id;
  if not found then
    raise exception 'booking_not_found' using errcode = 'P0001';
  end if;
  if v_from = p_to_slot_id then
    raise exception 'already_booked' using errcode = 'P0001';
  end if;
  perform 1 from public.clients c where c.id = v_client for update;
  perform 1 from public.class_slots cs where cs.id in (v_from, p_to_slot_id) order by cs.id for update;
  s_from := public.lock_slot_for_staff(v_from);
  s_to := public.lock_slot_for_staff(p_to_slot_id);
  select b.status into v_previous from public.bookings b where b.id = p_booking_id for update;
  if v_previous is null or v_previous not in ('booked', 'waitlisted') then
    raise exception 'booking_not_found' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.bookings b
    where b.slot_id = s_to.id and b.client_id = v_client and b.status in ('booked', 'waitlisted')
  ) then
    raise exception 'already_booked' using errcode = 'P0001';
  end if;
  v_forced := public.slot_booked_count(s_to.id) >= s_to.capacity;
  if v_forced and not coalesce(p_force, false) then
    raise exception 'slot_full' using errcode = 'P0001';
  end if;
  update public.bookings b set status = 'removed', status_changed_at = now() where b.id = p_booking_id;
  v_quota := public.weekly_quota(v_client);
  v_used := public.week_usage(v_client, s_to.gym_date);
  insert into public.bookings (slot_id, client_id, status, forced, added_by)
  values (s_to.id, v_client, 'booked', v_forced, public.current_profile_id())
  returning bookings.id into v_id;
  update public.bookings b set moved_to = v_id where b.id = p_booking_id;
  perform public.enqueue_notification('moved', v_client, s_to.id);
  return query select v_id, 'booked'::text, v_forced, v_quota is not null and v_used >= v_quota,
    case when v_previous = 'booked' then public.promote_waitlist(s_from.id) else 0 end;
end;
$$;

-- El monitor cambia una clase: lo que no se manda (null) se queda. Desde entonces el horario ya no la toca (`edited`).
-- Más plazas o volver a abrir: entra la espera. Otra hora: se avisa a los apuntados. Cancelarla anula todas sus
-- reservas, avisa a todos y no tiene vuelta atrás.
drop function if exists public.staff_update_slot(uuid, text, timestamptz, integer, integer, text);
create function public.staff_update_slot(
  p_slot_id uuid,
  p_name text default null,
  p_starts_at timestamptz default null,
  p_duration_minutes integer default null,
  p_capacity integer default null,
  p_status text default null
)
returns table (slot_id uuid, status text, capacity integer, promoted integer, notified integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s_old public.class_slots;
  s public.class_slots;
  v_notified integer := 0;
  v_promoted integer := 0;
  w record;
begin
  perform public.require_staff();
  s_old := public.lock_slot_for_staff(p_slot_id);
  update public.class_slots cs set
    name = coalesce(btrim(p_name), cs.name),
    starts_at = coalesce(p_starts_at, cs.starts_at),
    duration_minutes = coalesce(p_duration_minutes, cs.duration_minutes),
    capacity = coalesce(p_capacity, cs.capacity),
    status = coalesce(p_status, cs.status),
    edited = true
  where cs.id = p_slot_id
  returning cs.* into s;
  if s.status = 'cancelled' then
    for w in
      update public.bookings b set status = 'slot_cancelled', status_changed_at = now()
      where b.slot_id = p_slot_id and b.status in ('booked', 'waitlisted')
      returning b.client_id
    loop
      perform public.enqueue_notification('slot_cancelled', w.client_id, p_slot_id);
      v_notified := v_notified + 1;
    end loop;
  else
    if (s.starts_at, s.duration_minutes) is distinct from (s_old.starts_at, s_old.duration_minutes) then
      for w in
        select b.client_id from public.bookings b where b.slot_id = p_slot_id and b.status in ('booked', 'waitlisted')
      loop
        perform public.enqueue_notification('slot_changed', w.client_id, p_slot_id);
        v_notified := v_notified + 1;
      end loop;
    end if;
    v_promoted := public.promote_waitlist(p_slot_id);
  end if;
  return query select s.id, s.status, s.capacity, v_promoted, v_notified;
end;
$$;

-- El monitor añade una clase suelta, fuera del horario. Devuelve su id.
drop function if exists public.staff_create_slot(timestamptz, integer, integer, text);
create function public.staff_create_slot(p_starts_at timestamptz, p_duration_minutes integer, p_capacity integer, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_staff();
  if p_starts_at + make_interval(mins => p_duration_minutes) <= now() then
    raise exception 'slot_finished' using errcode = 'P0001';
  end if;
  insert into public.class_slots (starts_at, duration_minutes, capacity, name, edited)
  values (p_starts_at, p_duration_minutes, p_capacity, btrim(p_name), true)
  returning id into v_id;
  return v_id;
end;
$$;

-- Ficha del usuario: "Esta semana: 1 de 2" (quota null = sin límite), para la semana de ese día.
drop function if exists public.staff_week_usage(text, date);
create function public.staff_week_usage(p_client_id text, p_week date)
returns table (week_start date, used integer, quota integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  return query select public.gym_week_start(p_week), public.week_usage(p_client_id, p_week), public.weekly_quota(p_client_id);
end;
$$;

-- Fase 3 (usuarios): my_member, my_bookings, my_week_usage, book_class y cancel_booking irán aquí, con el mismo orden de
-- bloqueos, y la rama del usuario de class_slots_for.

revoke all on function public.gym_time_to_instant(date, time) from public, anon, authenticated;
revoke all on function public.gym_today() from public, anon, authenticated;
revoke all on function public.gym_week_start(date) from public, anon, authenticated;
revoke all on function public.booking_rules() from public, anon, authenticated;
revoke all on function public.weekly_quota(text) from public, anon, authenticated;
revoke all on function public.week_usage(text, date) from public, anon, authenticated;
revoke all on function public.slot_booked_count(uuid) from public, anon, authenticated;
revoke all on function public.enqueue_notification(text, text, uuid) from public, anon, authenticated;
revoke all on function public.ensure_class_slots(date, date) from public, anon, authenticated;
revoke all on function public.lock_slot_for_staff(uuid) from public, anon, authenticated;
revoke all on function public.require_staff() from public, anon, authenticated;
revoke all on function public.promote_waitlist(uuid) from public, anon, authenticated;
revoke all on function public.class_templates_sync() from public, anon, authenticated;
revoke all on function public.class_slots_for(date, date) from public, anon;
revoke all on function public.staff_add_booking(uuid, text, boolean) from public, anon;
revoke all on function public.staff_remove_booking(uuid) from public, anon;
revoke all on function public.staff_move_booking(uuid, uuid, boolean) from public, anon;
revoke all on function public.staff_update_slot(uuid, text, timestamptz, integer, integer, text) from public, anon;
revoke all on function public.staff_create_slot(timestamptz, integer, integer, text) from public, anon;
revoke all on function public.staff_week_usage(text, date) from public, anon;

grant execute on function public.class_slots_for(date, date) to authenticated;
grant execute on function public.staff_add_booking(uuid, text, boolean) to authenticated;
grant execute on function public.staff_remove_booking(uuid) to authenticated;
grant execute on function public.staff_move_booking(uuid, uuid, boolean) to authenticated;
grant execute on function public.staff_update_slot(uuid, text, timestamptz, integer, integer, text) to authenticated;
grant execute on function public.staff_create_slot(timestamptz, integer, integer, text) to authenticated;
grant execute on function public.staff_week_usage(text, date) to authenticated;

-- Permisos: el equipo activo lo lee todo; el horario y las reglas los cambia el admin; clases y reservas, solo las
-- funciones de arriba. Los avisos no los lee nadie desde la app.
alter table public.booking_settings enable row level security;
alter table public.class_templates enable row level security;
alter table public.class_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.notification_outbox enable row level security;

revoke all on public.booking_settings, public.class_templates, public.class_slots, public.bookings, public.notification_outbox
  from public, anon, authenticated;
grant select on public.booking_settings, public.class_templates, public.class_slots, public.bookings to authenticated;
grant insert, update on public.booking_settings to authenticated;
grant insert, update, delete on public.class_templates to authenticated;

drop policy if exists booking_settings_select on public.booking_settings;
create policy booking_settings_select on public.booking_settings for select to authenticated using (public.is_active_staff());
drop policy if exists booking_settings_insert on public.booking_settings;
create policy booking_settings_insert on public.booking_settings for insert to authenticated with check (public.is_admin());
drop policy if exists booking_settings_update on public.booking_settings;
create policy booking_settings_update on public.booking_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists class_templates_select on public.class_templates;
create policy class_templates_select on public.class_templates for select to authenticated using (public.is_active_staff());
drop policy if exists class_templates_insert on public.class_templates;
create policy class_templates_insert on public.class_templates for insert to authenticated with check (public.is_admin());
drop policy if exists class_templates_update on public.class_templates;
create policy class_templates_update on public.class_templates for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists class_templates_delete on public.class_templates;
create policy class_templates_delete on public.class_templates for delete to authenticated using (public.is_admin());

drop policy if exists class_slots_select on public.class_slots;
create policy class_slots_select on public.class_slots for select to authenticated using (public.is_active_staff());
drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings for select to authenticated using (public.is_active_staff());

-- ── El día que le toca ──────────────────────────────────────────────────────
-- Qué día de su rutina hizo cada uno en cada fecha del gimnasio. Lo apunta solo la pantalla: al salir alguien en una
-- sección (record_training_session, más abajo). De la última sale el día que le toca (shared/routine/nextDay.ts).
-- Una por persona y día. Como las clases, fuera del historial de cambios y de las copias.
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients (id) on delete cascade,
  gym_date date not null,
  program_id text not null,
  day_id text,
  day_number integer not null,
  slot_id uuid references public.class_slots (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  unique (client_id, gym_date)
);

create index if not exists training_sessions_gym_date_idx on public.training_sessions (gym_date);

alter table public.training_sessions drop constraint if exists training_sessions_day_check;
alter table public.training_sessions add constraint training_sessions_day_check check (day_number between 1 and 99) not valid;
do $$
begin
  alter table public.training_sessions validate constraint training_sessions_day_check;
exception when check_violation then
  raise notice 'Hay filas antiguas en training_sessions que no cumplen training_sessions_day_check: se quedan.';
end;
$$;

drop trigger if exists stamp_row on public.training_sessions;
create trigger stamp_row before insert or update on public.training_sessions for each row execute function public.stamp_row();

-- La clase en la que esa persona tiene plaza ahora: desde FILL_LEAD_MINUTES = 15 min antes hasta que termina
-- (sessionSlotFor en shared/routine/sessionRule.ts).
create or replace function public.session_slot(p_client_id text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.bookings b
  join public.class_slots s on s.id = b.slot_id
  where b.client_id = p_client_id and b.status = 'booked' and s.status <> 'cancelled'
    and now() >= s.starts_at - interval '15 minutes'
    and now() < s.starts_at + make_interval(mins => s.duration_minutes)
  order by s.starts_at desc
  limit 1
$$;

-- La regla, igual que applySessionRule (shared/routine/sessionRule.ts; los mismos casos se prueban en los dos):
-- - Alguien sale en una sección (nuevo ahí, u otro día): su sesión de hoy es ese día de su rutina actual (pasado el
--   último, el último), con la clase en la que tiene plaza ahora. Mandarlo otra vez cambia el día y no la hora en que
--   se apuntó. Archivados y quien no tiene rutina con días no se apuntan.
-- - Alguien deja una sección y no está en ninguna otra, antes de SESSION_UNDO_MINUTES = 10 min desde que se apuntó hoy:
--   fue un error y la sesión de hoy se borra. Después, se queda (ha entrenado).
-- Se ejecuta al final de cada petición, así quien solo cambia de sección en la misma petición no pierde su sesión.
create or replace function public.record_training_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new text := case when tg_op <> 'DELETE' then new.data ->> 'clientId' end;
  v_old text := case when tg_op <> 'INSERT' then old.data ->> 'clientId' end;
  v_program text;
  v_days jsonb;
  v_number integer;
begin
  if v_new is not null
    and (tg_op = 'INSERT' or v_new is distinct from v_old or (new.data -> 'day') is distinct from (old.data -> 'day')) then
    select p.id, p.data -> 'days' into v_program, v_days
    from public.clients c
    join public.programs p on p.id = c.data ->> 'currentProgramId' and p.data ->> 'clientId' = c.id
    where c.id = v_new and (c.data ->> 'archived') is distinct from 'true';
    if v_program is not null and jsonb_typeof(v_days) = 'array' and jsonb_array_length(v_days) > 0 then
      v_number := least((new.data ->> 'day')::integer, jsonb_array_length(v_days));
      insert into public.training_sessions as t (client_id, gym_date, program_id, day_id, day_number, slot_id)
      values (v_new, public.gym_today(), v_program, v_days -> (v_number - 1) ->> 'id', v_number, public.session_slot(v_new))
      on conflict (client_id, gym_date) do update
        set program_id = excluded.program_id, day_id = excluded.day_id, day_number = excluded.day_number,
          slot_id = coalesce(excluded.slot_id, t.slot_id);
    end if;
  end if;
  if v_old is not null and v_old is distinct from v_new
    and not exists (select 1 from public.screen_sections s where s.data ->> 'clientId' = v_old) then
    delete from public.training_sessions t
    where t.client_id = v_old and t.gym_date = public.gym_today() and t.created_at > now() - interval '10 minutes';
  end if;
  return null;
end;
$$;

drop trigger if exists record_training_session on public.screen_sections;
create trigger record_training_session after insert or update or delete on public.screen_sections
  for each row execute function public.record_training_session();

revoke all on function public.session_slot(text) from public, anon, authenticated;
revoke all on function public.record_training_session() from public, anon, authenticated;

-- El equipo activo las lee; nadie las escribe desde la app (solo la pantalla, con la regla de arriba).
alter table public.training_sessions enable row level security;
revoke all on public.training_sessions from public, anon, authenticated;
grant select on public.training_sessions to authenticated;
drop policy if exists training_sessions_select on public.training_sessions;
create policy training_sessions_select on public.training_sessions for select to authenticated using (public.is_active_staff());

-- ── Tiempo real ─────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'clients', 'programs', 'library_exercises', 'notes', 'settings', 'screens', 'screen_sections',
    'booking_settings', 'class_templates', 'class_slots', 'bookings', 'training_sessions'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Qué teles están abiertas viaja por un canal privado ('p33-screens-presence', SCREENS_PRESENCE_TOPIC en la app):
-- solo el equipo activo lo escucha y lo anuncia. Sin sesión no se ve ni se puede fingir una tele abierta.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    drop policy if exists p33_screens_presence_read on realtime.messages;
    create policy p33_screens_presence_read on realtime.messages for select to authenticated
      using (public.is_active_staff() and realtime.topic() = 'p33-screens-presence' and extension = 'presence');
    drop policy if exists p33_screens_presence_write on realtime.messages;
    create policy p33_screens_presence_write on realtime.messages for insert to authenticated
      with check (public.is_active_staff() and realtime.topic() = 'p33-screens-presence' and extension = 'presence');
  end if;
end;
$$;
