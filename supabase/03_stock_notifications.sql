-- ============================================================
-- Notificaciones semanales de stock
-- Ejecutar después de schema.sql y 02_storage_and_functions.sql
-- ============================================================

create table if not exists stock_notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_date date not null,
  recipient_email text,
  status text not null check (status in ('sent', 'skipped', 'error')),
  error_message text,
  sent_at timestamptz not null default now()
);

alter table stock_notification_logs enable row level security;

create policy "Autenticados pueden leer historial de notificaciones"
  on stock_notification_logs for select to authenticated using (true);

create unique index if not exists stock_notification_sent_date_idx
  on stock_notification_logs (notification_date)
  where status = 'sent';

-- La Edge Function debe invocarse cada lunes a las 12:00 UTC,
-- equivalente a las 09:00 en Argentina.
-- Reemplazar FUNCTION_URL por:
-- https://<PROJECT_REF>.supabase.co/functions/v1/send-stock-notification
-- Guardar el secreto en Vault antes de crear el cron:
-- select vault.create_secret('tu-secreto-largo', 'stock_notification_cron_secret');
--
-- Requiere las extensiones pg_cron, pg_net y Vault habilitadas.
-- select cron.schedule(
--   'send-stock-notification-monday',
--   '0 12 * * 1',
--   $$
--   select net.http_post(
--     url := 'https://rvzgaouwkmvtloououwj.supabase.co/functions/v1/send-stock-notification',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-stock-notification-secret',
--       (select decrypted_secret from vault.decrypted_secrets where name = 'stock_notification_cron_secret')
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
