-- Performance33 · Rutinas: base de datos, permisos y tiempo real.
-- Ejecútalo en el SQL Editor de Supabase (se puede repetir sin romper nada).
-- La primera cuenta de administrador se crea aparte, como explica el README.md.

-- ── Tablas ──────────────────────────────────────────────────────────────────

-- Una fila por persona con cuenta. Las cuentas las crea el administrador (función admin-users) y el rol
-- decide qué puede hacer cada una. Para añadir un rol: amplía el check, is_active_staff y lo que le toque.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  -- Vacío en las cuentas sin email: su dirección interna (.invalid) solo existe en auth.users.
  email text unique check (email = lower(email)),
  name text not null default '' check (char_length(name) <= 60),
  color text not null default '#d6449a' check (color ~ '^#[0-9a-fA-F]{6}$'),
  role text not null default 'monitor' check (role in ('admin', 'monitor')),
  active boolean not null default true,
  must_change_password boolean not null default false,
  -- La contraseña temporal vigente (su hash): así se sabe si de verdad la ha cambiado. Nadie la lee desde la app.
  temp_password_hash text,
  created_at timestamptz not null default now()
);

-- Las notas firman con el nombre y el color: nadie puede ponerse el nombre de otro.
create unique index if not exists profiles_name_unique on public.profiles (lower(trim(name))) where trim(name) <> '';

-- Intentos fallidos de entrar con usuario. El límite de intentos del servidor de acceso solo vería la IP de la función.
create table if not exists public.login_attempts (
  username text primary key,
  failures integer not null default 1,
  first_failed_at timestamptz not null default now()
);

-- Una fila por entidad; `data` guarda el objeto de la app tal cual. `client_origin` identifica la
-- ventana que escribió (para ignorar el eco de sus propios cambios en tiempo real).
create table if not exists public.clients (
  id text primary key,
  data jsonb not null,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.programs (
  id text primary key,
  data jsonb not null,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.library_exercises (
  id text primary key,
  data jsonb not null,
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

-- ── Funciones de ayuda para los permisos ───────────────────────────────────

-- Quien entra con Google no tiene contraseña temporal que cambiar. El dato viene firmado en su sesión.
create or replace function public.signed_in_with_google()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'amr' @> '[{"method": "oauth"}]'::jsonb or auth.jwt() -> 'amr' @> '["oauth"]'::jsonb, false)
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
create or replace function public.my_profile()
returns table (
  id uuid, username text, email text, name text, color text, role text, active boolean, must_change_password boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.email, p.name, p.color, p.role, p.active,
    p.must_change_password and not public.signed_in_with_google()
  from public.profiles p
  where p.user_id = auth.uid() and p.active
$$;

-- Ajustes → Equipo: los datos de acceso de todos, solo para administradores.
create or replace function public.team_accounts()
returns table (
  id uuid, username text, email text, name text, color text, role text, active boolean, must_change_password boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.email, p.name, p.color, p.role, p.active, p.must_change_password
  from public.profiles p
  where public.is_admin()
  order by p.name
$$;

-- Termina el primer acceso. Solo funciona si la contraseña ya no es la temporal: llamarla no basta para saltárselo.
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
    and p.temp_password_hash is distinct from (select u.encrypted_password from auth.users u where u.id = auth.uid());
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

create or replace function public.finish_library_seed()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  insert into public.settings (id, data, library_seeded_at) values ('main', '{}', now())
  on conflict (id) do update set library_seeded_at = coalesce(public.settings.library_seeded_at, now());
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

-- Bloqueo por usuario: 5 fallos en 15 minutos. Solo la función login-username.
create or replace function public.login_is_locked(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.login_attempts
    where username = p_username and failures >= 5 and first_failed_at > now() - interval '15 minutes'
  )
$$;

create or replace function public.login_record_failure(p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.login_attempts where first_failed_at <= now() - interval '15 minutes';
  insert into public.login_attempts (username) values (p_username)
  on conflict (username) do update set failures = public.login_attempts.failures + 1;
end;
$$;

create or replace function public.login_clear_failures(p_username text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.login_attempts where username = p_username
$$;

revoke all on function public.signed_in_with_google() from public, anon, authenticated;
revoke all on function public.current_profile_id() from public, anon;
revoke all on function public.is_active_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.my_profile() from public, anon;
revoke all on function public.team_accounts() from public, anon;
revoke all on function public.finish_password_change() from public, anon;
revoke all on function public.library_seed_pending() from public, anon;
revoke all on function public.finish_library_seed() from public, anon;
revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
revoke all on function public.login_is_locked(text) from public, anon, authenticated;
revoke all on function public.login_record_failure(text) from public, anon, authenticated;
revoke all on function public.login_clear_failures(text) from public, anon, authenticated;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.team_accounts() to authenticated;
grant execute on function public.finish_password_change() to authenticated;
grant execute on function public.library_seed_pending() to authenticated;
grant execute on function public.finish_library_seed() to authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
grant execute on function public.login_is_locked(text) to service_role;
grant execute on function public.login_record_failure(text) to service_role;
grant execute on function public.login_clear_failures(text) to service_role;

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
  foreach t in array array['clients', 'programs', 'library_exercises', 'notes', 'settings'] loop
    execute format('drop trigger if exists stamp_row on public.%I', t);
    execute format('create trigger stamp_row before insert or update on public.%I for each row execute function public.stamp_row()', t);
  end loop;
end;
$$;

-- ── Permisos por fila (RLS) ─────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.login_attempts enable row level security;
alter table public.clients enable row level security;
alter table public.programs enable row level security;
alter table public.library_exercises enable row level security;
alter table public.notes enable row level security;
alter table public.settings enable row level security;

revoke all on public.profiles, public.login_attempts, public.clients, public.programs, public.library_exercises, public.notes, public.settings from anon, authenticated;
grant select, insert, update, delete
  on public.clients, public.programs, public.library_exercises, public.notes, public.settings
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

-- Rutinas y biblioteca: todo el equipo activo.
do $$
declare
  t text;
begin
  foreach t in array array['programs', 'library_exercises'] loop
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
  foreach t in array array['profiles', 'clients', 'programs', 'library_exercises', 'notes', 'settings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
