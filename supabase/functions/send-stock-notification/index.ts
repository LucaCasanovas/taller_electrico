import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type StockItem = {
  sku: string
  material: string
  unit: string
  stock: number
  min_stock: number
  ideal_stock: number | null
  stock_categories: { name: string } | null
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const sender = Deno.env.get('STOCK_NOTIFICATION_FROM')!
const cronSecret = Deno.env.get('STOCK_NOTIFICATION_CRON_SECRET')

function getRecipients() {
  return (Deno.env.get('STOCK_NOTIFICATION_RECIPIENT') ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function argentinaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value)
}

function buildEmail(items: StockItem[], date: string) {
  const rows = items
    .map((item) => {
      const requested = item.ideal_stock === null
        ? 'Definir cantidad ideal'
        : `${formatNumber(Math.max(0, item.ideal_stock - item.stock))} ${escapeHtml(item.unit)}`
      const ideal = item.ideal_stock === null
        ? 'Sin definir'
        : `${formatNumber(item.ideal_stock)} ${escapeHtml(item.unit)}`
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(item.material)}</strong><br><span style="color:#6b7280;font-size:12px">${escapeHtml(item.sku)} · ${escapeHtml(item.stock_categories?.name ?? '')}</span></td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatNumber(item.stock)} ${escapeHtml(item.unit)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatNumber(item.min_stock)} ${escapeHtml(item.unit)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">${ideal}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${requested}</td>
      </tr>`
    })
    .join('')

  return `<div style="font-family:Arial,sans-serif;color:#1f2937;max-width:760px;margin:auto">
    <h1 style="font-size:22px">Materiales para reponer</h1>
    <p style="color:#6b7280">Resumen semanal del ${date.split('-').reverse().join('/')}. Hay ${items.length} material${items.length === 1 ? '' : 'es'} bajo el stock mínimo.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f3f4f6;text-align:right">
        <th style="padding:12px;text-align:left">Material</th><th style="padding:12px">Actual</th><th style="padding:12px">Mínimo</th><th style="padding:12px">Ideal</th><th style="padding:12px">Pedir</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;color:#6b7280;font-size:12px">Enviado automáticamente por Taller Eléctrico.</p>
  </div>`
}

Deno.serve(async (request: Request) => {
  const requestSecret = request.headers.get('x-stock-notification-secret')
  if (cronSecret && requestSecret !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const notificationDate = argentinaDate()
  let status = 'error'
  let errorMessage: string | null = null
  let recipientEmails: string[] = []

  try {
    recipientEmails = getRecipients()
    if (!resendApiKey || recipientEmails.length === 0 || !sender) {
      throw new Error('Faltan RESEND_API_KEY, STOCK_NOTIFICATION_RECIPIENT o STOCK_NOTIFICATION_FROM')
    }

    const { data: previous, error: previousError } = await supabase
      .from('stock_notification_logs')
      .select('id')
      .eq('notification_date', notificationDate)
      .eq('status', 'sent')
      .limit(1)
    if (previousError) throw previousError
    if (previous && previous.length > 0) {
      status = 'skipped'
      return Response.json({ ok: true, skipped: true, reason: 'already_sent', date: notificationDate })
    }

    const { data: items, error: itemsError } = await supabase
      .from('stock_items')
      .select('sku, material, unit, stock, min_stock, ideal_stock, stock_categories(name)')
      .eq('archived', false)
      .order('material')
    if (itemsError) throw itemsError

    const lowStockItems = (items as StockItem[] ?? []).filter(
      (item: StockItem) => Number(item.stock) <= Number(item.min_stock),
    )
    if (lowStockItems.length === 0) {
      status = 'skipped'
      return Response.json({ ok: true, skipped: true, reason: 'no_items', date: notificationDate })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: recipientEmails,
        subject: `Stock para reponer · ${lowStockItems.length} material${lowStockItems.length === 1 ? '' : 'es'}`,
        html: buildEmail(lowStockItems as StockItem[], notificationDate),
      }),
    })
    if (!response.ok) throw new Error(`Resend respondió ${response.status}: ${await response.text()}`)

    status = 'sent'
    return Response.json({ ok: true, sent: true, date: notificationDate, count: lowStockItems.length })
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json({ ok: false, error: errorMessage, date: notificationDate }, { status: 500 })
  } finally {
    await supabase.from('stock_notification_logs').insert({
      notification_date: notificationDate,
      recipient_email: recipientEmails.join(',') || null,
      status,
      error_message: errorMessage,
    })
  }
})
