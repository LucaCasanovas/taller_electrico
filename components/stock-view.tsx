'use client'

import { useMemo, useState } from 'react'
import {
  Archive,
  Boxes,
  Minus,
  Pencil,
  Plus,
  PackageSearch,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { ViewHeader } from '@/components/view-header'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { StockCategory, StockItem, StockUnit } from '@/lib/data'

const UNITS: StockUnit[] = ['Metros', 'Rollos', 'Unidades', 'Bolsas']

type FormState = {
  id: string | null
  sku: string
  material: string
  categoryId: string
  unit: StockUnit
  stock: string
  minStock: string
}

const EMPTY_FORM: FormState = {
  id: null,
  sku: '',
  material: '',
  categoryId: '',
  unit: 'Unidades',
  stock: '',
  minStock: '',
}

type StockViewProps = {
  stock: StockItem[]
  categories: StockCategory[]
  onAdjust: (itemId: string, delta: number) => void
  onCreate: (input: {
    sku: string
    material: string
    categoryId: string
    unit: StockUnit
    stock: number
    minStock: number
  }) => Promise<void>
  onUpdate: (
    id: string,
    input: {
      sku: string
      material: string
      categoryId: string
      unit: StockUnit
      minStock: number
    },
  ) => Promise<void>
  onArchive: (id: string) => Promise<void>
  onCreateCategory: (name: string) => Promise<StockCategory>
  onBack: () => void
}

export function StockView({
  stock,
  categories,
  onAdjust,
  onCreate,
  onUpdate,
  onArchive,
  onCreateCategory,
  onBack,
}: StockViewProps) {
  const FILTERS = ['Todos', ...categories.map((category) => category.name)]
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('Todos')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [savingForm, setSavingForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [itemToArchive, setItemToArchive] = useState<StockItem | null>(null)

  const lowStock = stock.filter((item) => item.stock <= item.minStock)

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return stock.filter((item) => {
      const matchesFilter = filter === 'Todos' || item.category === filter
      const matchesTerm =
        term.length === 0 ||
        item.material.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term)
      return matchesFilter && matchesTerm
    })
  }, [filter, query, stock])

  function openCreateForm() {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' })
    setFormOpen(true)
  }

  function openEditForm(item: StockItem) {
    setForm({
      id: item.id,
      sku: item.sku,
      material: item.material,
      categoryId: item.categoryId,
      unit: item.unit,
      stock: String(item.stock),
      minStock: String(item.minStock),
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setForm(EMPTY_FORM)
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    setAddingCategory(true)
    try {
      const category = await onCreateCategory(name)
      setForm((current) => ({ ...current, categoryId: category.id }))
      setNewCategoryName('')
      toast.success('Categoría creada', { description: name })
    } catch (error) {
      toast.error('No se pudo crear la categoría', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    } finally {
      setAddingCategory(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.sku.trim() || !form.material.trim() || !form.categoryId) return

    setSavingForm(true)
    try {
      if (form.id) {
        await onUpdate(form.id, {
          sku: form.sku.trim(),
          material: form.material.trim(),
          categoryId: form.categoryId,
          unit: form.unit,
          minStock: Number(form.minStock) || 0,
        })
        toast.success('Insumo actualizado', { description: form.material.trim() })
      } else {
        await onCreate({
          sku: form.sku.trim(),
          material: form.material.trim(),
          categoryId: form.categoryId,
          unit: form.unit,
          stock: Number(form.stock) || 0,
          minStock: Number(form.minStock) || 0,
        })
        toast.success('Insumo agregado', { description: form.material.trim() })
      }
      closeForm()
    } catch (error) {
      toast.error('No se pudo guardar el insumo', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    } finally {
      setSavingForm(false)
    }
  }

  async function handleArchive(item: StockItem) {
    setArchivingId(item.id)
    try {
      await onArchive(item.id)
      toast.success('Insumo eliminado', { description: item.material })
    } catch (error) {
      toast.error('No se pudo eliminar el insumo', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    } finally {
      setArchivingId(null)
      setItemToArchive(null)
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ViewHeader eyebrow="Insumos del taller" title="Stock a Granel" onBack={onBack}>
        <Button size="sm" onClick={openCreateForm}>
          <Plus data-icon="inline-start" />
          Nuevo Insumo
        </Button>
      </ViewHeader>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Boxes className="size-4" />
                Total Insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-3xl font-semibold tabular-nums">
                {stock.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Materiales cargados en {categories.length} categorías
              </p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <TriangleAlert className="size-4" />
                En Stock Mínimo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-3xl font-semibold tabular-nums text-destructive">
                {lowStock.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lowStock.length === 0
                  ? 'Todo el stock está por encima del mínimo'
                  : 'Requieren reposición inmediata'}
              </p>
            </CardContent>
          </Card>
        </div>

        {formOpen ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                {form.id ? 'Editar Insumo' : 'Nuevo Insumo'}
                <Button variant="ghost" size="icon-sm" onClick={closeForm} aria-label="Cerrar">
                  <X />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="stock-sku">SKU</FieldLabel>
                  <Input
                    id="stock-sku"
                    required
                    value={form.sku}
                    onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="stock-material">Material</FieldLabel>
                  <Input
                    id="stock-material"
                    required
                    value={form.material}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, material: event.target.value }))
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="stock-category">Categoría</FieldLabel>
                  <select
                    id="stock-category"
                    required
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, categoryId: event.target.value }))
                    }
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-white px-2.5 py-1 text-base text-black outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm [&>option]:bg-white [&>option]:text-black"
                  >
                    <option value="" disabled>
                      Elegí una categoría
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="stock-new-category">Agregar categoría nueva</FieldLabel>
                  <div className="flex gap-1.5">
                    <Input
                      id="stock-new-category"
                      placeholder="Ej: Ventilación"
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!newCategoryName.trim() || addingCategory}
                      onClick={handleAddCategory}
                    >
                      {addingCategory ? '…' : 'Crear'}
                    </Button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="stock-unit">Unidad</FieldLabel>
                  <select
                    id="stock-unit"
                    required
                    value={form.unit}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, unit: event.target.value as StockUnit }))
                    }
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-white px-2.5 py-1 text-base text-black outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm [&>option]:bg-white [&>option]:text-black"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="stock-current">
                    Stock actual {form.id ? '(se ajusta con +/-, no acá)' : ''}
                  </FieldLabel>
                  <Input
                    id="stock-current"
                    type="number"
                    min={0}
                    disabled={Boolean(form.id)}
                    value={form.stock}
                    onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="stock-min">Stock mínimo</FieldLabel>
                  <Input
                    id="stock-min"
                    type="number"
                    min={0}
                    required
                    value={form.minStock}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, minStock: event.target.value }))
                    }
                  />
                </Field>

                <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={savingForm}>
                    {savingForm ? 'Guardando…' : form.id ? 'Guardar Cambios' : 'Agregar al Stock'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col gap-3">
          <InputGroup className="sm:max-w-md">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Buscar material o SKU…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
          <ToggleGroup
            value={[filter]}
            onValueChange={(value) => setFilter(value[0] ?? 'Todos')}
            variant="outline"
            size="sm"
            className="flex-wrap"
          >
            {FILTERS.map((option) => (
              <ToggleGroupItem key={option} value={option}>
                {option}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Card>
          <CardContent className="px-0">
            {rows.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageSearch />
                  </EmptyMedia>
                  <EmptyTitle>Sin insumos para esta búsqueda</EmptyTitle>
                  <EmptyDescription>
                    Cambiá el término de búsqueda, otra categoría, o agregá un
                    insumo nuevo.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">SKU</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Stock Mínimo</TableHead>
                    <TableHead className="pr-4 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => {
                    const isLow = item.stock <= item.minStock
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                          {item.sku}
                        </TableCell>
                        <TableCell className="whitespace-normal font-medium">
                          {item.material}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-2">
                            {isLow ? (
                              <TriangleAlert className="size-3.5 text-destructive" />
                            ) : null}
                            <span
                              className={
                                isLow
                                  ? 'font-mono font-semibold tabular-nums text-destructive'
                                  : 'font-mono tabular-nums'
                              }
                            >
                              {item.stock}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {item.minStock}
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <ButtonGroup>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                aria-label={`Descontar stock de ${item.material}`}
                                disabled={item.stock === 0}
                                onClick={() => onAdjust(item.id, -1)}
                              >
                                <Minus />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                aria-label={`Sumar stock de ${item.material}`}
                                onClick={() => onAdjust(item.id, 1)}
                              >
                                <Plus />
                              </Button>
                            </ButtonGroup>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Editar ${item.material}`}
                              onClick={() => openEditForm(item)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Eliminar ${item.material}`}
                              disabled={archivingId === item.id}
                              onClick={() => setItemToArchive(item)}
                            >
                              <Archive className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <ConfirmDialog
        open={Boolean(itemToArchive)}
        title="Eliminar insumo"
        description={
          itemToArchive
            ? `¿Querés eliminar "${itemToArchive.material}" del stock?`
            : ''
        }
        busy={Boolean(itemToArchive && archivingId === itemToArchive.id)}
        onCancel={() => setItemToArchive(null)}
        onConfirm={() => {
          if (itemToArchive) void handleArchive(itemToArchive)
        }}
      />
    </div>
  )
}