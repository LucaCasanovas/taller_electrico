'use client'

import { AlertTriangle, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onCancel()
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-xl bg-card p-6 text-card-foreground shadow-2xl ring-1 ring-foreground/10"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-semibold">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar confirmación"
            disabled={busy}
            onClick={onCancel}
          >
            <X />
          </Button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? 'Eliminando…' : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}
