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
create table if not exists public.screens (
  id text primary key check (id ~ '^[1-8]$'),
  data jsonb not null check (coalesce(
    data - array['name', 'sections'] = '{}'::jsonb
    and jsonb_typeof(data -> 'name') = 'string' and char_length(btrim(data ->> 'name')) between 1 and 30
    and jsonb_typeof(data -> 'sections') = 'number' and (data ->> 'sections') ~ '^[1-6]$',
    false
  )),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- Qué se ve en cada sección ('pantalla:sección'): un usuario (o nadie) y el día de su rutina. Nada más, nada privado.
-- Una fila por sección: dos monitores que mandan a la vez a secciones distintas no se pisan.
create table if not exists public.screen_sections (
  id text primary key check (id ~ '^[1-8]:[1-6]$'),
  screen_id text not null references public.screens (id) on delete cascade,
  data jsonb not null check (coalesce(
    data - array['clientId', 'day', 'assignedAt'] = '{}'::jsonb
    and jsonb_typeof(data -> 'clientId') in ('string', 'null') and char_length(coalesce(data ->> 'clientId', '')) <= 100
    and jsonb_typeof(data -> 'day') = 'number' and (data ->> 'day') ~ '^[1-9][0-9]?$'
    and jsonb_typeof(data -> 'assignedAt') = 'string' and char_length(data ->> 'assignedAt') <= 40,
    false
  )),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  check (split_part(id, ':', 1) = screen_id)
);

create index if not exists screen_sections_screen_id_idx on public.screen_sections (screen_id);

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

-- ── Tiempo real ─────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'clients', 'programs', 'library_exercises', 'notes', 'settings', 'screens', 'screen_sections'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
