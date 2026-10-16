'use client'

import { useEffect, useMemo, useState } from 'react'
import { Boxes, ImageIcon, Minus, Plus, Warehouse } from 'lucide-react'
import { toast } from 'sonner'

import { ViewHeader } from '@/components/view-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StockCategory, StockItem } from '@/lib/data'
import {
  extractCableMeasure,
  isCablesCategory,
  sortCableMeasures,
  workerCategoryImageSrc,
  workerMaterialImageSrc,
} from '@/lib/worker-images'

type WorkerStockViewProps = {
  stock: StockItem[]
  categories: StockCategory[]
  onAdjust: (itemId: string, delta: number) => void
  /** Si no se pasa, la pantalla es standalone (sin botón volver). */
  onBack?: () => void
}

function WorkerImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted/40 text-muted-foreground">
        <ImageIcon className="size-8 opacity-50" />
        <span className="px-2 text-center text-[0.65rem] leading-tight">Sin imagen</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- rutas estáticas en /public/worker
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain p-3"
      onError={() => setFailed(true)}
    />
  )
}

export function WorkerStockView({ stock, categories, onAdjust, onBack }: WorkerStockViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id ?? '')
  const [measureFilter, setMeasureFilter] = useState<string | null>(null)
  const [quantityByItem, setQuantityByItem] = useState<Record<string, number>>({})

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategoryId('')
      return
    }

    if (!categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  const categoriesWithItems = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: stock.filter((item) => item.categoryId === category.id),
      })),
    [categories, stock],
  )

  const selectedCategory =
    categoriesWithItems.find((category) => category.id === selectedCategoryId) ?? categoriesWithItems[0]

  const selectedItems = useMemo(() => selectedCategory?.items ?? [], [selectedCategory])

  const showMeasureFilter = Boolean(selectedCategory && isCablesCategory(selectedCategory.name))

  const availableMeasures = useMemo(() => {
    if (!showMeasureFilter) return [] as string[]

    const measures = new Set<string>()
    for (const item of selectedItems) {
      const measure = extractCableMeasure(item)
      if (measure) measures.add(measure)
    }
    return sortCableMeasures([...measures])
  }, [selectedItems, showMeasureFilter])

  const visibleItems = useMemo(() => {
    if (!showMeasureFilter || !measureFilter) return selectedItems
    return selectedItems.filter((item) => extractCableMeasure(item) === measureFilter)
  }, [selectedItems, showMeasureFilter, measureFilter])

  useEffect(() => {
    setMeasureFilter(null)
  }, [selectedCategoryId])

  useEffect(() => {
    if (measureFilter && !availableMeasures.includes(measureFilter)) {
      setMeasureFilter(null)
    }
  }, [availableMeasures, measureFilter])

  useEffect(() => {
    setQuantityByItem((current) => {
      const next = { ...current }
      let changed = false

      for (const item of selectedItems) {
        const maxQty = Math.max(1, item.stock || 1)
        const normalizedQty = Math.min(Math.max(1, current[item.id] ?? 1), maxQty)

        if (next[item.id] !== normalizedQty) {
          next[item.id] = normalizedQty
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [selectedItems])

  function updateQuantity(item: StockItem, delta: number) {
    setQuantityByItem((current) => {
      const nextQty = (current[item.id] ?? 1) + delta
      const maxQty = Math.max(1, item.stock || 1)
      return {
        ...current,
        [item.id]: Math.min(maxQty, Math.max(1, nextQty)),
      }
    })
  }

  function handleConsume(item: StockItem) {
    const quantity = Math.min(quantityByItem[item.id] ?? 1, item.stock)

    if (item.stock <= 0 || quantity <= 0) {
      toast.warning('No hay stock disponible para este material.', {
        description: `${item.material} quedó sin unidades en el taller.`,
      })
      return
    }

    onAdjust(item.id, -quantity)
    setQuantityByItem((current) => ({ ...current, [item.id]: 1 }))
    toast.success(`Se restaron ${quantity} ${item.unit} de ${item.material}`)
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <ViewHeader eyebrow="Trabajador" title="Uso de stock" onBack={onBack}>
        <Badge variant="secondary" className="font-mono">
          {stock.length} materiales
        </Badge>
      </ViewHeader>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 md:px-6">
        <section className="rounded-2xl border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Categorías
              </p>
              <h2 className="text-base font-semibold">Seleccioná la sección</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              <Boxes className="size-3.5" />
              {categoriesWithItems.length}
            </div>
          </div>

          {categoriesWithItems.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Todavía no hay categorías cargadas en el stock.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {categoriesWithItems.map((category) => {
                const isSelected = category.id === selectedCategoryId
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={[
                      'overflow-hidden rounded-2xl border text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                        : 'border-border bg-background hover:border-primary/30 hover:bg-muted/60',
                    ].join(' ')}
                  >
                    <div className="aspect-[4/3] w-full bg-muted/30">
                      <WorkerImage
                        src={workerCategoryImageSrc(category.name)}
                        alt={category.name}
                      />
                    </div>
                    <div className="border-t px-3 py-3.5">
                      <p className="text-center text-xl font-semibold leading-tight text-pretty">
                        {category.name}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {selectedCategory ? (
          <section className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  Materiales
                </p>
                <h3 className="text-xl font-semibold">{selectedCategory.name}</h3>
              </div>
              <div className="flex items-center gap-2 self-start rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground sm:self-auto">
                <Warehouse className="size-3.5" />
                {visibleItems.length}
                {measureFilter ? ` / ${selectedItems.length}` : ''} items
              </div>
            </div>

            {showMeasureFilter && availableMeasures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={measureFilter === null ? 'default' : 'outline'}
                  className="min-h-10 px-4 text-sm"
                  onClick={() => setMeasureFilter(null)}
                >
                  Todas
                </Button>
                {availableMeasures.map((measure) => (
                  <Button
                    key={measure}
                    type="button"
                    size="sm"
                    variant={measureFilter === measure ? 'default' : 'outline'}
                    className="min-h-10 px-4 font-mono text-sm"
                    onClick={() => setMeasureFilter(measure)}
                  >
                    {measure}
                  </Button>
                ))}
              </div>
            ) : null}

            {selectedItems.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-44 items-center justify-center text-center text-sm text-muted-foreground">
                  Esta categoría no tiene materiales cargados todavía.
                </CardContent>
              </Card>
            ) : visibleItems.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-44 items-center justify-center text-center text-sm text-muted-foreground">
                  No hay cables de {measureFilter} en esta sección.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => {
                  const quantity = quantityByItem[item.id] ?? 1
                  const canUse = item.stock > 0

                  return (
                    <Card key={item.id} className="overflow-hidden border shadow-sm">
                      <CardHeader className="border-b bg-muted/30 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="min-w-0 text-lg leading-snug text-pretty md:text-xl">
                            {item.material}
                          </CardTitle>
                          <Badge variant="secondary" className="shrink-0 font-mono text-[0.65rem]">
                            {item.stock} {item.unit}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-4">
                        <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted/20">
                          <WorkerImage
                            src={workerMaterialImageSrc(item.sku)}
                            alt={item.material}
                          />
                        </div>

                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Restar 1 de ${item.material}`}
                            onClick={() => updateQuantity(item, -1)}
                            disabled={!canUse}
                          >
                            <Minus className="size-4" />
                          </Button>

                          <div className="rounded-xl border bg-background px-2 py-3 text-center">
                            <div className="font-mono text-2xl font-semibold tabular-nums">{quantity}</div>
                            <div className="text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
                              {item.unit}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Sumar 1 de ${item.material}`}
                            onClick={() => updateQuantity(item, 1)}
                            disabled={!canUse}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>

                        <Button
                          size="lg"
                          className="w-full text-base"
                          variant={canUse ? 'destructive' : 'secondary'}
                          onClick={() => handleConsume(item)}
                          disabled={!canUse}
                        >
                          {canUse ? `Restar ${quantity} ${item.unit}` : 'Sin stock'}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  )
}
