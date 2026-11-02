-- Performance33 · Rutinas: base de datos, permisos y tiempo real.
-- Ejecútalo en el SQL Editor de Supabase (se puede repetir sin romper nada).
-- El primer administrador se añade aparte, con la instrucción del README.md.

-- ── Tablas ──────────────────────────────────────────────────────────────────

-- Lista de acceso: solo entra quien tenga aquí una fila activa con su email.
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name text not null default '',
  color text not null default '#d6449a',
  role text not null default 'monitor' check (role in ('admin', 'monitor')),
  active boolean not null default true,
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.staff drop constraint if exists staff_name_length;
alter table public.staff add constraint staff_name_length check (char_length(name) <= 60);
alter table public.staff drop constraint if exists staff_color_hex;
alter table public.staff add constraint staff_color_hex check (color ~ '^#[0-9a-fA-F]{6}$');
-- Las notas firman con el nombre y el color: nadie puede ponerse el nombre de otro.
create unique index if not exists staff_name_unique on public.staff (lower(trim(name))) where trim(name) <> '';

-- Una fila por entidad; `data` guarda el objeto de la app tal cual. `client_origin` identifica la
-- ventana que escribió (para ignorar el eco de sus propios cambios en tiempo real).
create table if not exists public.clients (
  id text primary key,
  data jsonb not null,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff (id) on delete set null
);

create table if not exists public.programs (
  id text primary key,
  data jsonb not null,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff (id) on delete set null
);

create table if not exists public.library_exercises (
  id text primary key,
  data jsonb not null,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff (id) on delete set null
);

-- Al borrar un cliente sus notas se borran con él, sean de quien sean: una nota de salud no debe
-- quedar huérfana. Por eso solo el administrador puede borrar clientes (ver los permisos más abajo).
create table if not exists public.notes (
  id text primary key,
  data jsonb not null,
  author_staff_id uuid references public.staff (id) on delete set null,
  client_id text not null references public.clients (id) on delete cascade,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff (id) on delete set null
);

create index if not exists notes_client_id_idx on public.notes (client_id);

-- Una sola fila: la marca del gimnasio.
create table if not exists public.settings (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null,
  client_origin text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff (id) on delete set null
);

-- ── Funciones de ayuda para los permisos ───────────────────────────────────

create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.staff where user_id = auth.uid() and active
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active and role = 'admin')
$$;

-- Primer acceso: enlaza la cuenta con su fila de `staff`, solo si el email está verificado y además la
-- cuenta es de fiar. Un email verificado no basta: cualquiera puede registrar el email de un monitor con
-- su propia contraseña, y el monitor confirmarlo sin darse cuenta. Son de fiar las cuentas solo de Google
-- con ese mismo email, y las autorizadas con allow_password_account. Una fila ya enlazada a otra cuenta
-- no se puede reclamar. Devuelve la fila activa, o nada si no hay acceso.
create or replace function public.claim_staff_profile()
returns setof public.staff
language plpgsql
security definer
set search_path = ''
as $$
declare
  verified_email text;
begin
  select lower(u.email) into verified_email
  from auth.users u
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
    and lower(u.email) = lower(auth.jwt() ->> 'email')
    and (
      u.raw_app_meta_data ->> 'p33_password_allowed' = 'true'
      or (
        exists (select 1 from auth.identities i where i.user_id = u.id)
        and not exists (
          select 1 from auth.identities i
          where i.user_id = u.id
            and (i.provider <> 'google' or lower(i.identity_data ->> 'email') is distinct from lower(u.email))
        )
      )
    );

  if verified_email is not null then
    update public.staff
    set user_id = auth.uid()
    where email = verified_email and active and user_id is null;
  end if;

  return query select * from public.staff where user_id = auth.uid() and active;
end;
$$;

-- Autoriza una cuenta con contraseña creada a mano en el panel de Supabase. Se ejecuta en el SQL Editor,
-- nunca desde la app: solo el dueño de la base de datos puede llamarla.
create or replace function public.allow_password_account(account_email text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"p33_password_allowed": true}'::jsonb
  where lower(email) = lower(trim(account_email));
  if not found then
    raise exception 'No hay ninguna cuenta con ese email: créala primero en Authentication > Users.';
  end if;
end;
$$;

revoke all on function public.allow_password_account(text) from public, anon, authenticated;
revoke all on function public.current_staff_id() from public, anon;
revoke all on function public.is_active_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.claim_staff_profile() from public, anon;
grant execute on function public.current_staff_id() to authenticated;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_staff_profile() to authenticated;

-- ── Reglas del equipo (triggers) ────────────────────────────────────────────

-- Estos triggers NO son security definer: así `current_user` distingue a quien usa la app
-- ('authenticated') de claim_staff_profile y del borrado en cascada de una cuenta, que actúan como dueño.
create or replace function public.staff_normalize_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  if tg_op = 'INSERT' and current_user = 'authenticated' then
    new.user_id := null;
  end if;
  return new;
end;
$$;

create or replace function public.staff_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;
  if new.id <> old.id or new.created_at <> old.created_at
    or new.email is distinct from old.email
    or new.user_id is distinct from old.user_id then
    raise exception 'staff_field_locked' using errcode = 'P0001';
  end if;
  if old.user_id = auth.uid() and (new.role <> old.role or new.active <> old.active) then
    raise exception 'staff_own_access_locked' using errcode = 'P0001';
  end if;
  if not public.is_admin() and (new.role <> old.role or new.active <> old.active) then
    raise exception 'staff_own_access_locked' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Nadie puede borrarse a sí mismo: quedaría fuera sin poder volver a entrar.
create or replace function public.staff_guard_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and old.user_id = auth.uid() then
    raise exception 'staff_own_access_locked' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

-- Siempre tiene que quedar un administrador activo que ya haya entrado: una fila sin reclamar no cuenta,
-- y se puede quitar (por si se escribió mal un email). El bloqueo evita que dos admins se quiten a la vez.
create or replace function public.staff_keep_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.active and old.user_id is not null
    and (tg_op = 'DELETE' or new.role <> 'admin' or not new.active) then
    perform pg_advisory_xact_lock(hashtext('public.staff.admins'));
    if not exists (
      select 1 from public.staff
      where id <> old.id and active and role = 'admin' and user_id is not null
    ) then
      raise exception 'staff_last_admin' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Sustituida por la comprobación de arriba: ya no hace falta exponerla a la app.
drop function if exists public.other_active_admin_exists(uuid);

drop trigger if exists staff_normalize_email on public.staff;
create trigger staff_normalize_email before insert or update of email on public.staff
  for each row execute function public.staff_normalize_email();

drop trigger if exists staff_guard_update on public.staff;
create trigger staff_guard_update before update on public.staff
  for each row execute function public.staff_guard_update();

drop trigger if exists staff_guard_delete on public.staff;
create trigger staff_guard_delete before delete on public.staff
  for each row execute function public.staff_guard_delete();

drop trigger if exists staff_keep_last_admin on public.staff;
create trigger staff_keep_last_admin before update or delete on public.staff
  for each row execute function public.staff_keep_last_admin();

-- Fecha y autor los pone siempre el servidor (no se pueden falsificar desde el navegador).
create or replace function public.stamp_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := public.current_staff_id();
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

alter table public.staff enable row level security;
alter table public.clients enable row level security;
alter table public.programs enable row level security;
alter table public.library_exercises enable row level security;
alter table public.notes enable row level security;
alter table public.settings enable row level security;

revoke all on public.staff, public.clients, public.programs, public.library_exercises, public.notes, public.settings from anon, authenticated;
grant select, insert, update, delete
  on public.staff, public.clients, public.programs, public.library_exercises, public.notes, public.settings
  to authenticated;

-- Equipo: lo ve el equipo; altas y bajas, el admin; cada uno edita su fila (el trigger limita a nombre y color).
drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff for select to authenticated using (public.is_active_staff());
drop policy if exists staff_insert on public.staff;
create policy staff_insert on public.staff for insert to authenticated with check (public.is_admin());
drop policy if exists staff_update on public.staff;
create policy staff_update on public.staff for update to authenticated
  using (public.is_admin() or (active and user_id = auth.uid()))
  with check (public.is_admin() or (active and user_id = auth.uid()));
drop policy if exists staff_delete on public.staff;
create policy staff_delete on public.staff for delete to authenticated using (public.is_admin());

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
drop policy if exists clients_all on public.clients;
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
  with check (public.is_admin() or (public.is_active_staff() and author_staff_id = public.current_staff_id()));
drop policy if exists notes_update on public.notes;
create policy notes_update on public.notes for update to authenticated
  using (public.is_admin() or (public.is_active_staff() and author_staff_id = public.current_staff_id()))
  with check (public.is_admin() or (public.is_active_staff() and author_staff_id = public.current_staff_id()));
drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes for delete to authenticated
  using (public.is_admin() or (public.is_active_staff() and author_staff_id = public.current_staff_id()));

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
  foreach t in array array['staff', 'clients', 'programs', 'library_exercises', 'notes', 'settings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
