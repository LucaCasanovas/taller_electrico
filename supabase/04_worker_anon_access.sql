-- ============================================================
-- Acceso sin login para /trabajador
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Efecto:
--   - Anónimos pueden LEER stock (categorías + items)
--   - Anónimos pueden CONSUMIR (restar) stock vía worker_consume_stock
--   - No pueden sumar stock ni tocar otras tablas
--
-- Seguridad: cualquiera con la URL /trabajador + la anon key
-- (pública en el frontend) puede restar insumos. No compartas
-- el enlace fuera del taller si eso es un problema.
-- ============================================================

-- Lectura de catálogo de insumos del taller
create policy "Anon: lectura stock categorias"
  on stock_categories for select to anon
  using (true);

create policy "Anon: lectura stock items"
  on stock_items for select to anon
  using (true);

-- Solo restar (consumo en taller). No permite deltas positivos.
create or replace function worker_consume_stock(p_item_id uuid, p_quantity numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'La cantidad a restar debe ser positiva';
  end if;

  update stock_items
  set stock = greatest(0, stock - p_quantity)
  where id = p_item_id;

  if not found then
    raise exception 'Material no encontrado';
  end if;

  insert into stock_movements (stock_item_id, delta, reason, created_by)
  values (p_item_id, -p_quantity, 'consumo trabajador', auth.uid());
end;
$$;

grant execute on function worker_consume_stock(uuid, numeric) to anon;
grant execute on function worker_consume_stock(uuid, numeric) to authenticated;
