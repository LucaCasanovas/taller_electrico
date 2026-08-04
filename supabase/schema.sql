-- ============================================================
-- Esquema: Taller Eléctrico - Proyectos y Stock
-- Ejecutar en Supabase → SQL Editor → New query
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PERFILES DE USUARIO (empleados)
-- Se completa automáticamente cuando alguien se registra
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- Trigger: al crear un usuario en auth.users, crear su perfil
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- CATÁLOGO DE COMPONENTES (para Proyectos / tableros)
-- ------------------------------------------------------------
create table catalog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table catalog_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category_id uuid not null references catalog_categories (id) on delete restrict,
  spec text,               -- descripción técnica corta (ej: "32 A · Riel DIN")
  image_url text,          -- solo para identificación visual en el catálogo
  archived boolean not null default false, -- para "borrar" sin romper proyectos viejos
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- STOCK A GRANEL
-- ------------------------------------------------------------
create table stock_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table stock_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  material text not null,
  category_id uuid not null references stock_categories (id) on delete restrict,
  unit text not null check (unit in ('Metros', 'Rollos', 'Unidades', 'Bolsas')),
  stock numeric not null default 0,
  min_stock numeric not null default 0,
  archived boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- Historial de movimientos de stock (quién ajustó qué y cuándo)
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  delta numeric not null,           -- positivo = ingreso, negativo = egreso
  reason text,                      -- opcional: "compra", "uso en proyecto X", etc.
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROYECTOS (tableros eléctricos)
-- ------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  status text not null default 'activo' check (status in ('activo', 'archivado')),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  catalog_item_id uuid not null references catalog_items (id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unique (project_id, catalog_item_id)
);

create table project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  storage_path text not null,   -- path dentro del bucket de Supabase Storage
  file_name text,
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Regla general: cualquier empleado autenticado puede leer y
-- escribir (no hay roles diferenciados todavía, según lo charlado).
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table catalog_categories enable row level security;
alter table catalog_items enable row level security;
alter table stock_categories enable row level security;
alter table stock_items enable row level security;
alter table stock_movements enable row level security;
alter table projects enable row level security;
alter table project_lines enable row level security;
alter table project_photos enable row level security;

create policy "Usuarios autenticados pueden leer perfiles"
  on profiles for select to authenticated using (true);

create policy "Autenticados: lectura total" on catalog_categories
  for select to authenticated using (true);
create policy "Autenticados: escritura total" on catalog_categories
  for all to authenticated using (true) with check (true);

create policy "Autenticados: lectura total" on catalog_items
  for select to authenticated using (true);
create policy "Autenticados: escritura total" on catalog_items
  for all to authenticated using (true) with check (true);

create policy "Autenticados: lectura total" on stock_categories
  for select to authenticated using (true);
create policy "Autenticados: escritura total" on stock_categories
  for all to authenticated using (true) with check (true);

create policy "Autenticados: lectura total" on stock_items
  for select to authenticated using (true);
create policy "Autenticados: escritura total" on stock_items
  for all to authenticated using (true) with check (true);

create policy "Autenticados: lectura total" on stock_movements
  for select to authenticated using (true);
create policy "Autenticados: insertar" on stock_movements
  for insert to authenticated with check (true);

create policy "Autenticados: lectura total" on projects
  for select to authenticated using (true);
create policy "Autenticados: escritura total" on projects
  for all to authenticated using (true) with check (true);

create policy "Autenticados: lectura total" on project_lines
  for select to authenticated using (true);
create policy "Autenticados: escritura total" on project_lines
  for all to authenticated using (true) with check (true);

create policy "Autenticados: lectura total" on project_photos
  for select to authenticated using (true);
create policy "Autenticados: escritura total" on project_photos
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- DATOS INICIALES: categorías (mismas que ya tenías en el front)
-- ------------------------------------------------------------
insert into catalog_categories (name, sort_order) values
  ('Interruptores', 1),
  ('Soportes', 2),
  ('Relés', 3),
  ('Borneras', 4),
  ('Señalización', 5);

insert into stock_categories (name, sort_order) values
  ('Cables', 1),
  ('Termocontraíbles', 2),
  ('Terminales', 3),
  ('Fijación', 4),
  ('Identificación', 5);
