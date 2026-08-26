'use client'

import { ChevronRight, Eye, FileDown, FolderOpen, Layers, LogOut, PlusCircle, Settings2, Trash2, Zap } from 'lucide-react'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, totalUnits, type Project } from '@/lib/data'

type HomeViewProps = {
  projects: Project[]
  lowStockCount: number
  userEmail?: string
  onCreateProject: () => void
  onOpenStock: () => void
  onManageCatalog: () => void
  onViewProject: (projectId: string) => void
  onExportProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
  onSignOut: () => void
}

export function HomeView({
  projects,
  lowStockCount,
  userEmail,
  onCreateProject,
  onOpenStock,
  onManageCatalog,
  onViewProject,
  onExportProject,
  onDeleteProject,
  onSignOut,
}: HomeViewProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-16">
      <div className="mb-6 flex items-center justify-end gap-3 text-sm text-muted-foreground">
        {userEmail ? <span className="truncate">{userEmail}</span> : null}
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut data-icon="inline-start" />
          Salir
        </Button>
      </div>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-4xl bg-secondary px-3 py-1 font-mono text-[0.7rem] tracking-widest text-secondary-foreground uppercase">
          <Zap className="size-3" />
          Taller de tableros
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Gestión de Tableros y Componentes
        </h1>
        <p className="max-w-xl leading-relaxed text-muted-foreground text-pretty">
          Armá el listado de componentes de cada tablero, documentá el trabajo
          con fotos y controlá el stock a granel del taller desde un solo lugar.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCreateProject}
          className="group flex flex-col gap-4 rounded-xl bg-primary p-6 text-left text-primary-foreground ring-1 ring-primary/20 transition-all outline-none hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
            <PlusCircle className="size-5" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-lg font-medium">Crear Proyecto</span>
            <span className="text-sm leading-relaxed text-primary-foreground/75">
              Seleccioná componentes del catálogo y guardá el tablero con su
              evidencia fotográfica.
            </span>
          </span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium">
            Comenzar
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenStock}
          className="group flex flex-col gap-4 rounded-xl bg-card p-6 text-left text-card-foreground ring-1 ring-foreground/10 transition-all outline-none hover:-translate-y-0.5 hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Layers className="size-5" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-lg font-medium">
              Stock a Granel
              {lowStockCount > 0 ? (
                <Badge variant="destructive">{lowStockCount} bajo mínimo</Badge>
              ) : null}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              Ajustá cables, termocontraíbles y terminales medidos por metro,
              rollo o unidad.
            </span>
          </span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
            Ver insumos
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <Button variant="ghost" size="sm" onClick={onManageCatalog}>
          <Settings2 data-icon="inline-start" />
          Administrar Catálogo de Componentes
        </Button>
      </div>

      <Card className="mt-10">
        <CardHeader className="border-b">
          <CardTitle>Proyectos Recientes</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {projects.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>Todavía no hay proyectos guardados</EmptyTitle>
                <EmptyDescription>
                  Creá tu primer tablero para verlo listado acá con su fecha y
                  total de componentes.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Fecha</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">
                    Total Componentes
                  </TableHead>
                  <TableHead className="pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                      {formatDate(project.date)}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.client || 'Sin cliente asignado'} ·{' '}
                        {project.photos} foto
                        {project.photos === 1 ? '' : 's'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {totalUnits(project.lines)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewProject(project.id)}
                        >
                          <Eye data-icon="inline-start" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExportProject(project.id)}
                        >
                          <FileDown data-icon="inline-start" />
                          Exportar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Eliminar ${project.name}`}
                          onClick={() => onDeleteProject(project.id)}
                        >
                          <Trash2 className="text-destructive" />
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
  )
}
