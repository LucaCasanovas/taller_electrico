-- ============================================================
-- Ejecutar DESPUÉS de schema.sql, en el mismo SQL Editor
-- ============================================================

-- Función para ajustar stock de forma atómica y dejar registro
-- del movimiento (evita condiciones de carrera entre empleados).
create or replace function adjust_stock(p_item_id uuid, p_delta numeric, p_reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update stock_items
  set stock = greatest(0, stock + p_delta)
  where id = p_item_id;

  insert into stock_movements (stock_item_id, delta, reason, created_by)
  values (p_item_id, p_delta, p_reason, auth.uid());
end;
$$;

grant execute on function adjust_stock(uuid, numeric, text) to authenticated;

-- Bucket de Storage para las fotos de evidencia de cada proyecto
insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', true)
on conflict (id) do nothing;

create policy "Autenticados pueden subir fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-photos');

create policy "Autenticados pueden ver fotos"
  on storage.objects for select to authenticated
  using (bucket_id = 'project-photos');

create policy "Autenticados pueden borrar fotos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-photos');
