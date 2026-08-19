-- Datos de demostración (ficticios) para el proyecto de Supabase del portafolio público.
-- Ejecutar DESPUÉS de schema.sql, en un proyecto de Supabase SEPARADO del real.
-- Todas las fechas son relativas a CURRENT_DATE, así que la demo siempre se ve "viva"
-- sin importar cuándo se corra este script.

-- ── Recurrentes de ejemplo (Sueldo, Renta, Pago tarjeta) ───────────────────
-- Se insertan tanto la plantilla en recurring_expenses como sus transacciones
-- ya materializadas, replicando lo que hace la app al crear un recurrente.

do $$
declare
  v_sueldo_cat uuid;
  v_renta_cat uuid;
  v_deudas_cat uuid;
  v_comida_cat uuid;
  v_transporte_cat uuid;
  v_entretenimiento_cat uuid;

  v_sueldo_id uuid;
  v_renta_id uuid;
  v_deudas_id uuid;

  v_start date;
  v_end date;
  v_cursor date;
begin
  select id into v_sueldo_cat from categories where name = 'Sueldo' limit 1;
  select id into v_renta_cat from categories where name = 'Renta' limit 1;
  select id into v_deudas_cat from categories where name = 'Deudas' limit 1;
  select id into v_comida_cat from categories where name = 'Comida' limit 1;
  select id into v_transporte_cat from categories where name = 'Transporte' limit 1;
  select id into v_entretenimiento_cat from categories where name = 'Entretenimiento' limit 1;

  -- Sueldo: mensual, día 1, de hace 3 meses a 9 meses en el futuro
  v_start := date_trunc('month', current_date - interval '3 months');
  v_end := date_trunc('month', current_date + interval '9 months');

  insert into recurring_expenses (name, amount, category_id, frequency, start_date, end_date)
  values ('Sueldo', 45000, v_sueldo_cat, 'monthly', v_start, v_end)
  returning id into v_sueldo_id;

  v_cursor := v_start;
  while v_cursor <= v_end loop
    insert into transactions (date, amount, description, category_id, recurring_expense_id)
    values (v_cursor, 45000, 'Sueldo', v_sueldo_cat, v_sueldo_id);
    v_cursor := v_cursor + interval '1 month';
  end loop;

  -- Renta: mensual, mismo rango
  insert into recurring_expenses (name, amount, category_id, frequency, start_date, end_date)
  values ('Renta depto', -12000, v_renta_cat, 'monthly', v_start, v_end)
  returning id into v_renta_id;

  v_cursor := v_start;
  while v_cursor <= v_end loop
    insert into transactions (date, amount, description, category_id, recurring_expense_id)
    values (v_cursor, -12000, 'Renta depto', v_renta_cat, v_renta_id);
    v_cursor := v_cursor + interval '1 month';
  end loop;

  -- Pago tarjeta: quincenal (cada 15 días), de hace 2 meses a 2 meses en el futuro
  v_start := current_date - interval '2 months';
  v_end := current_date + interval '2 months';

  insert into recurring_expenses (name, amount, category_id, frequency, start_date, end_date)
  values ('Pago tarjeta', -1500, v_deudas_cat, 'biweekly', v_start, v_end)
  returning id into v_deudas_id;

  v_cursor := v_start;
  while v_cursor <= v_end loop
    insert into transactions (date, amount, description, category_id, recurring_expense_id)
    values (v_cursor, -1500, 'Pago tarjeta', v_deudas_cat, v_deudas_id);
    v_cursor := v_cursor + interval '15 days';
  end loop;

  -- ── Transacciones sueltas (no recurrentes) de los últimos ~2 meses ──────

  -- Comida: un par de compras por semana, monto variable
  v_cursor := current_date - interval '9 weeks';
  while v_cursor <= current_date loop
    insert into transactions (date, amount, description, category_id)
    values (v_cursor, -round((600 + random() * 900)::numeric, 0), 'Supermercado', v_comida_cat);
    insert into transactions (date, amount, description, category_id)
    values (v_cursor + interval '3 days', -round((150 + random() * 350)::numeric, 0), 'Comida rápida', v_comida_cat);
    v_cursor := v_cursor + interval '7 days';
  end loop;

  -- Transporte: dos o tres cargos por semana
  v_cursor := current_date - interval '8 weeks';
  while v_cursor <= current_date loop
    insert into transactions (date, amount, description, category_id)
    values (v_cursor + interval '1 day', -round((80 + random() * 150)::numeric, 0), 'Gasolina / transporte', v_transporte_cat);
    insert into transactions (date, amount, description, category_id)
    values (v_cursor + interval '4 days', -round((60 + random() * 120)::numeric, 0), 'Uber', v_transporte_cat);
    v_cursor := v_cursor + interval '7 days';
  end loop;

  -- Entretenimiento: uno o dos gastos por mes
  v_cursor := current_date - interval '2 months';
  while v_cursor <= current_date loop
    insert into transactions (date, amount, description, category_id)
    values (v_cursor + interval '5 days', -round((300 + random() * 600)::numeric, 0), 'Cine / streaming', v_entretenimiento_cat);
    v_cursor := v_cursor + interval '1 month';
  end loop;

  -- Un par de ingresos extra sin recurrencia
  insert into transactions (date, amount, description, category_id)
  values (current_date - interval '18 days', 3500, 'Proyecto freelance', v_sueldo_cat);
  insert into transactions (date, amount, description, category_id)
  values (current_date - interval '45 days', 2200, 'Venta artículo usado', null);

end $$;
