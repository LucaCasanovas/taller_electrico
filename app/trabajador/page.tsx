'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { WorkerStockView } from '@/components/worker-stock-view'
import type { StockCategory, StockItem } from '@/lib/data'
import {
  consumeStockAsWorker,
  fetchStockCategories,
  fetchStockItems,
} from '@/lib/supabase/queries'

/**
 * Pantalla exclusiva para trabajadores — sin login.
 * URL: /trabajador (marcar como favorito; al recargar permanece acá).
 * Requiere haber ejecutado supabase/04_worker_anon_access.sql en Supabase.
 */
export default function TrabajadorPage() {
  const [loadingData, setLoadingData] = useState(true)
  const [stock, setStock] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<StockCategory[]>([])

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    Promise.all([fetchStockItems(), fetchStockCategories()])
      .then(([stockData, categoryData]) => {
        if (cancelled) return
        setStock(stockData)
        setCategories(categoryData)
      })
      .catch((error) => {
        toast.error('No se pudieron cargar los insumos', {
          description:
            error instanceof Error
              ? error.message
              : 'Si acabás de desplegar, ejecutá 04_worker_anon_access.sql en Supabase.',
        })
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAdjustStock(itemId: string, delta: number) {
    // La vista siempre manda delta negativo al consumir
    const quantity = Math.abs(delta)
    if (quantity <= 0) return

    setStock((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, stock: Math.max(0, item.stock - quantity) } : item,
      ),
    )
    try {
      await consumeStockAsWorker(itemId, quantity)
    } catch (error) {
      toast.error('No se pudo actualizar el stock', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
      const refreshed = await fetchStockItems()
      setStock(refreshed)
    }
  }

  if (loadingData) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando insumos del taller…</p>
      </main>
    )
  }

  return (
    <WorkerStockView
      stock={stock}
      categories={categories}
      onAdjust={handleAdjustStock}
    />
  )
}
