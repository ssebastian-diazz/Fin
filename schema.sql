-- Ejecutar esto completo en el SQL Editor de tu proyecto Supabase.

create extension if not exists "pgcrypto";

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bg_color text not null default '#E5E7EB',
  text_color text not null default '#111827',
  kind text not null check (kind in ('income','expense')),
  is_movable boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  recurrence_group_id uuid,
  created_at timestamptz not null default now()
);

create index transactions_date_idx on transactions (date);
create index transactions_category_idx on transactions (category_id);
create index transactions_recurrence_idx on transactions (recurrence_group_id);

-- El saldo corriente y el agrupado por semana/mes se calculan en el
-- frontend (src/lib/dates.ts), con semanas de lunes a domingo recortadas
-- al mes correspondiente. No hay lógica de calendario en la base de datos.

-- Habilita RLS. Como es una app de un solo usuario sin login,
-- se deja abierta con la anon key (mantén el proyecto privado / no compartas la key).
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "allow all categories" on categories for all using (true) with check (true);
create policy "allow all transactions" on transactions for all using (true) with check (true);

-- Categorías iniciales de ejemplo — bórralas o edítalas desde la app.
insert into categories (name, bg_color, text_color, kind, is_movable, sort_order) values
  ('Sueldo', '#16A34A', '#FFFFFF', 'income', false, 0),
  ('Renta', '#7C3AED', '#FFFFFF', 'expense', false, 1),
  ('Comida', '#F59E0B', '#111827', 'expense', true, 2),
  ('Transporte', '#0EA5E9', '#111827', 'expense', true, 3),
  ('Entretenimiento', '#EC4899', '#111827', 'expense', true, 4),
  ('Deudas', '#DC2626', '#FFFFFF', 'expense', false, 5);

-- ── Recurrentes ──────────────────────────────────────────────────────────
-- Ejecuta esto en el SQL Editor de Supabase antes de usar la pantalla
-- "Recurrentes". Una plantilla recurrente: nombre, monto, categoría (de ahí
-- hereda el color) y calendario (inicio, frecuencia, fin = "plazo"). Al
-- crearla o editarla se materializan filas normales en `transactions` que
-- apuntan de vuelta aquí vía `recurring_expense_id`.

create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null,
  category_id uuid references categories(id) on delete set null,
  frequency text not null check (frequency in ('weekly','biweekly','monthly')),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

alter table transactions
  add column if not exists recurring_expense_id uuid references recurring_expenses(id) on delete set null;

create index if not exists recurring_expenses_category_idx on recurring_expenses (category_id);
create index if not exists transactions_recurring_expense_idx on transactions (recurring_expense_id);

alter table recurring_expenses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'recurring_expenses' and policyname = 'allow all recurring_expenses'
  ) then
    create policy "allow all recurring_expenses" on recurring_expenses for all using (true) with check (true);
  end if;
end $$;

-- transactions.recurrence_group_id queda como columna heredada: la app deja
-- de leerla/escribirla (reemplazada por recurring_expense_id). No se borra
-- para no perder las filas viejas hasta correr la migración única que las
-- vincula a su recurring_expenses correspondiente (ver .tmp-migrate-recurring.mjs).
