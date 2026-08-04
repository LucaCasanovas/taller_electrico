'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { FileDown, PackageSearch, Save, Search, Trash2 } from 'lucide-react'

import { CatalogCard } from '@/components/catalog-card'
import { PhotoEvidence } from '@/components/photo-evidence'
import { QuantityStepper } from '@/components/quantity-stepper'
import { ViewHeader } from '@/components/view-header'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CatalogItem, ProjectLine, ProjectPhoto } from '@/lib/data'

type CreateProjectViewProps = {
  catalog: CatalogItem[]
  catalogCategoryNames: string[]
  initialName?: string
  initialClient?: string
  initialLines?: ProjectLine[]
  onBack: () => void
  onSave: (payload: {
    name: string
    client: string
    lines: ProjectLine[]
    photoFiles: File[]
  }) => void
  onExport: (name: string) => void
  saving?: boolean
}

export function CreateProjectView({
  catalog: catalogItems,
  catalogCategoryNames,
  initialName = '',
  initialClient = '',
  initialLines = [],
  onBack,
  onSave,
  onExport,
  saving = false,
}: CreateProjectViewProps) {
  const FILTERS = ['Todos', ...catalogCategoryNames]
  const [name, setName] = useState(initialName)
  const [client, setClient] = useState(initialClient)
  const [lines, setLines] = useState<ProjectLine[]>(initialLines)
  const [photos, setPhotos] = useState<ProjectPhoto[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('Todos')
  const [showNameError, setShowNameError] = useState(false)

  const catalog = useMemo(() => {
    const term = query.trim().toLowerCase()
    return catalogItems
      .filter((item) => {
        const matchesFilter = filter === 'Todos' || item.category === filter
        const matchesTerm =
          term.length === 0 ||
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term)
        return matchesFilter && matchesTerm
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [catalogItems, filter, query])

  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0)

  function addLine(itemId: string, quantity: number) {
    setLines((current) => {
      const existing = current.find((line) => line.itemId === itemId)
      if (existing) {
        return current.map((line) =>
          line.itemId === itemId
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      }
      return [...current, { itemId, quantity }]
    })
  }

  function setLineQuantity(itemId: string, quantity: number) {
    setLines((current) =>
      quantity < 1
        ? current.filter((line) => line.itemId !== itemId)
        : current.map((line) =>
            line.itemId === itemId ? { ...line, quantity } : line,
          ),
    )
  }

  function handleSave() {
    if (name.trim().length === 0) {
      setShowNameError(true)
      return
    }
    onSave({
      name: name.trim(),
      client: client.trim(),
      lines,
      photoFiles: photos.map((photo) => photo.file),
    })
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ViewHeader
        eyebrow="Nuevo tablero"
        title="Crear Proyecto"
        onBack={onBack}
      >
        <Field
          orientation="horizontal"
          className="w-full sm:w-64"
          data-invalid={showNameError || undefined}
        >
          <FieldLabel htmlFor="project-name" className="sr-only">
            Nombre del Proyecto
          </FieldLabel>
          <Input
            id="project-name"
            required
            placeholder="Nombre del Proyecto *"
            value={name}
            aria-invalid={showNameError || undefined}
            onChange={(event) => {
              setName(event.target.value)
              if (showNameError) setShowNameError(false)
            }}
          />
        </Field>
        <Field orientation="horizontal" className="w-full sm:w-64">
          <FieldLabel htmlFor="project-client" className="sr-only">
            Cliente o número de serie
          </FieldLabel>
          <Input
            id="project-client"
            placeholder="Cliente / N° de Serie"
            value={client}
            onChange={(event) => setClient(event.target.value)}
          />
        </Field>
      </ViewHeader>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Catálogo de componentes" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <InputGroup>
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

          {catalog.length === 0 ? (
            <Empty className="border py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageSearch />
                </EmptyMedia>
                <EmptyTitle>Sin resultados</EmptyTitle>
                <EmptyDescription>
                  Probá con otro nombre, SKU o quitá el filtro de categoría.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.map((item) => (
                <CatalogCard
                  key={item.id}
                  item={item}
                  inProject={
                    lines.find((line) => line.itemId === item.id)?.quantity ?? 0
                  }
                  onAdd={(quantity) => addLine(item.id, quantity)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                Componentes Agregados
                <Badge variant="secondary" className="font-mono">
                  {totalItems}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {lines.length === 0 ? (
                <p className="py-6 text-center text-sm leading-relaxed text-muted-foreground text-pretty">
                  Todavía no agregaste componentes. Elegí una cantidad en el
                  catálogo y sumalo al proyecto.
                </p>
              ) : (
                lines.map((line) => {
                  const item = catalogItems.find((entry) => entry.id === line.itemId)
                  if (!item) return null
                  return (
                    <div
                      key={line.itemId}
                      className="flex items-center gap-2.5 rounded-lg border border-border p-2"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-muted">
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="font-mono text-[0.7rem] text-muted-foreground">
                          {item.sku}
                        </p>
                      </div>
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(value) =>
                          setLineQuantity(line.itemId, value)
                        }
                        min={0}
                        label={item.name}
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar ${item.name} del proyecto`}
                        onClick={() => setLineQuantity(line.itemId, 0)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                Evidencia Fotográfica
                <Badge variant="outline" className="font-mono">
                  {photos.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoEvidence
                photos={photos}
                onAdd={(files) =>
                  setPhotos((current) => [
                    ...current,
                    ...files.map((file) => ({
                      id: `${file.name}-${crypto.randomUUID()}`,
                      name: file.name,
                      url: URL.createObjectURL(file),
                      file,
                    })),
                  ])
                }
                onRemove={(photoId) =>
                  setPhotos((current) => {
                    const target = current.find((photo) => photo.id === photoId)
                    if (target) URL.revokeObjectURL(target.url)
                    return current.filter((photo) => photo.id !== photoId)
                  })
                }
              />
            </CardContent>
          </Card>
        </aside>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-mono font-medium text-foreground">
              {totalItems}
            </span>{' '}
            componentes ·{' '}
            <span className="font-mono font-medium text-foreground">
              {photos.length}
            </span>{' '}
            fotos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onExport(name.trim() || 'Proyecto sin nombre')}
            >
              <FileDown data-icon="inline-start" />
              Exportar (PDF/Excel)
            </Button>
            <Button size="lg" onClick={handleSave} disabled={saving}>
              <Save data-icon="inline-start" />
              {saving ? 'Guardando…' : 'Guardar Proyecto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
