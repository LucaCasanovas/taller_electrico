'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Archive, ImagePlus, Pencil, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'

import { ViewHeader } from '@/components/view-header'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import type { CatalogCategory, CatalogItem } from '@/lib/data'

export type FormState = {
  id: string | null
  sku: string
  name: string
  categoryId: string
  spec: string
  imageFile: File | null
  imagePreview: string | null
  existingImage: string | null
}

export const EMPTY_FORM: FormState = {
  id: null,
  sku: '',
  name: '',
  categoryId: '',
  spec: '',
  imageFile: null,
  imagePreview: null,
  existingImage: null,
}

type CatalogAdminViewProps = {
  items: CatalogItem[]
  categories: CatalogCategory[]
  onBack: () => void
  onCreate: (input: {
    sku: string
    name: string
    categoryId: string
    spec?: string
    imageFile: File | null
  }) => Promise<void>
  onUpdate: (
    id: string,
    input: {
      sku: string
      name: string
      categoryId: string
      spec?: string
      imageFile: File | null
    },
  ) => Promise<void>
  onArchive: (id: string) => Promise<void>
  onCreateCategory: (name: string) => Promise<CatalogCategory>
}

export function CatalogAdminView({
  items,
  categories,
  onBack,
  onCreate,
  onUpdate,
  onArchive,
  onCreateCategory,
}: CatalogAdminViewProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('Todos')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [savingForm, setSavingForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [itemToArchive, setItemToArchive] = useState<CatalogItem | null>(null)

  const FILTERS = ['Todos', ...categories.map((category) => category.name)]

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return items
      .filter((item) => {
        const matchesFilter = filter === 'Todos' || item.category === filter
        const matchesTerm =
          term.length === 0 ||
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term)
        return matchesFilter && matchesTerm
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [items, filter, query])

  function openCreateForm() {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' })
    setFormOpen(true)
  }

  function openEditForm(item: CatalogItem) {
    setForm({
      id: item.id,
      sku: item.sku,
      name: item.name,
      categoryId: item.categoryId,
      spec: item.spec ?? '',
      imageFile: null,
      imagePreview: null,
      existingImage: item.image,
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
    if (!form.sku.trim() || !form.name.trim() || !form.categoryId) return

    setSavingForm(true)
    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        categoryId: form.categoryId,
        spec: form.spec.trim(),
        imageFile: form.imageFile,
      }
      if (form.id) {
        await onUpdate(form.id, payload)
        toast.success('Componente actualizado', { description: payload.name })
      } else {
        await onCreate(payload)
        toast.success('Componente agregado', { description: payload.name })
      }
      closeForm()
    } catch (error) {
      toast.error('No se pudo guardar el componente', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    } finally {
      setSavingForm(false)
    }
  }

  async function handleArchive(item: CatalogItem) {
    setArchivingId(item.id)
    try {
      await onArchive(item.id)
      toast.success('Componente eliminado', { description: item.name })
    } catch (error) {
      toast.error('No se pudo eliminar el componente', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    } finally {
      setArchivingId(null)
      setItemToArchive(null)
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ViewHeader eyebrow="Catálogo" title="Componentes de Tablero" onBack={onBack}>
        <Button size="sm" onClick={openCreateForm}>
          <Plus data-icon="inline-start" />
          Nuevo Componente
        </Button>
      </ViewHeader>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        {formOpen ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                {form.id ? 'Editar Componente' : 'Nuevo Componente'}
                <Button variant="ghost" size="icon-sm" onClick={closeForm} aria-label="Cerrar">
                  <X />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
                <div className="flex flex-col items-center gap-2">
                  <label
                    htmlFor="catalog-image"
                    className="relative flex size-28 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-input bg-muted text-muted-foreground"
                  >
                    {form.imagePreview || form.existingImage ? (
                      <Image
                        src={form.imagePreview ?? form.existingImage ?? '/placeholder.svg'}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <>
                        <ImagePlus className="size-5" />
                        <span className="text-[0.65rem]">Foto</span>
                      </>
                    )}
                  </label>
                  <input
                    id="catalog-image"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      setForm((current) => ({
                        ...current,
                        imageFile: file,
                        imagePreview: URL.createObjectURL(file),
                      }))
                    }}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="catalog-sku">SKU</FieldLabel>
                    <Input
                      id="catalog-sku"
                      required
                      value={form.sku}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, sku: event.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="catalog-name">Nombre</FieldLabel>
                    <Input
                      id="catalog-name"
                      required
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="catalog-category">Categoría</FieldLabel>
                    <select
                      id="catalog-category"
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
                    <FieldLabel htmlFor="catalog-new-category">Agregar categoría nueva</FieldLabel>
                    <div className="flex gap-1.5">
                      <Input
                        id="catalog-new-category"
                        placeholder="Ej: Cajas y gabinetes"
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
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="catalog-spec">
                      Especificación técnica
                    </FieldLabel>
                    <Input
                      id="catalog-spec"
                      placeholder="Ej: 32 A · Riel DIN"
                      value={form.spec}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, spec: event.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="flex justify-end gap-2 md:col-span-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={savingForm}>
                    {savingForm ? 'Guardando…' : form.id ? 'Guardar Cambios' : 'Agregar al Catálogo'}
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
              placeholder="Buscar por nombre o SKU…"
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
                    <ImagePlus />
                  </EmptyMedia>
                  <EmptyTitle>Sin componentes para esta búsqueda</EmptyTitle>
                  <EmptyDescription>
                    Cambiá el término de búsqueda, otra categoría, o agregá un
                    componente nuevo.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4"></TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Especificación</TableHead>
                    <TableHead className="pr-4 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-4">
                        <div className="relative size-9 overflow-hidden rounded-sm bg-muted">
                          <Image
                            src={item.image || '/placeholder.svg'}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.spec}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${item.name}`} onClick={() => openEditForm(item)}>
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Eliminar ${item.name}`}
                            disabled={archivingId === item.id}
                            onClick={() => setItemToArchive(item)}
                          >
                            <Archive className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <ConfirmDialog
        open={Boolean(itemToArchive)}
        title="Eliminar componente"
        description={
          itemToArchive
            ? `¿Querés eliminar "${itemToArchive.name}" del catálogo? No se borrará de los proyectos ya guardados.`
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
