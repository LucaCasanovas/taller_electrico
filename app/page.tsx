'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CatalogAdminView } from '@/components/catalog-admin-view'
import { LoginView } from '@/components/auth/login-view'
import { CreateProjectView } from '@/components/create-project-view'
import { HomeView } from '@/components/home-view'
import { StockView } from '@/components/stock-view'
import { exportProjectPdf } from '@/lib/export-project-pdf'
import { createClient } from '@/lib/supabase/client'
import {
  adjustStock,
  archiveCatalogItem,
  archiveStockItem,
  createCatalogCategory,
  createCatalogItem,
  createProject,
  createStockCategory,
  createStockItem,
  fetchCatalogCategories,
  fetchCatalogItems,
  fetchProjects,
  fetchProjectPhotos,
  fetchStockCategories,
  fetchStockItems,
  archiveProject,
  signOut,
  updateCatalogItem,
  updateProject,
  updateStockItem,
  uploadCatalogImage,
} from '@/lib/supabase/queries'
import {
  type CatalogCategory,
  type CatalogItem,
  type Project,
  type ProjectLine,
  type ProjectPhoto,
  type StockCategory,
  type StockItem,
  totalUnits,
} from '@/lib/data'

type View = 'home' | 'create' | 'stock' | 'catalog'

type Draft = {
  projectId?: string
  name: string
  client: string
  lines: ProjectLine[]
  photos: ProjectPhoto[]
}

const EMPTY_DRAFT: Draft = { name: '', client: '', lines: [], photos: [] }

export default function Page() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [userEmail, setUserEmail] = useState<string | undefined>()

  const [view, setView] = useState<View>('home')
  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([])
  const [stockCategories, setStockCategories] = useState<StockCategory[]>([])

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [draftKey, setDraftKey] = useState(0)

  // ---- Sesión ----
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? undefined)
      setCheckingSession(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? undefined)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  // ---- Carga de datos una vez autenticado ----
  useEffect(() => {
    if (!userEmail) return
    let cancelled = false
    setLoadingData(true)
    Promise.all([
      fetchProjects(),
      fetchStockItems(),
      fetchCatalogItems(),
      fetchCatalogCategories(),
      fetchStockCategories(),
    ])
      .then(([projectsData, stockData, catalogData, catalogCats, stockCats]) => {
        if (cancelled) return
        setProjects(projectsData)
        setStock(stockData)
        setCatalog(catalogData)
        setCatalogCategories(catalogCats)
        setStockCategories(stockCats)
      })
      .catch((error) => {
        toast.error('No se pudieron cargar los datos', {
          description: error instanceof Error ? error.message : 'Reintentá en unos segundos.',
        })
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false)
      })
    return () => {
      cancelled = true
    }
  }, [userEmail])

  const lowStockCount = stock.filter((item) => item.stock <= item.minStock).length

  function openDraft(next: Draft) {
    setDraft(next)
    setDraftKey((key) => key + 1)
    setView('create')
  }

  async function handleViewProject(projectId: string) {
    const project = projects.find((entry) => entry.id === projectId)
    if (!project) return
    const photos = await fetchProjectPhotos(projectId)
    openDraft({
      projectId,
      name: project.name,
      client: project.client,
      lines: project.lines,
      photos,
    })
  }

  async function handleExport(input: {
    name: string
    client: string
    date?: string
    lines: ProjectLine[]
    photos: ProjectPhoto[]
  }) {
    try {
      await exportProjectPdf({ ...input, catalog })
      toast.success('PDF descargado', {
        description: `Se exportó "${input.name || 'Proyecto sin nombre'}" correctamente.`,
      })
    } catch (error) {
      toast.error('No se pudo generar el PDF', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    }
  }

  async function handleExportProject(projectId: string) {
    try {
      const project = projects.find((entry) => entry.id === projectId)
      if (!project) return
      const photos = await fetchProjectPhotos(projectId)
      await handleExport({
        name: project.name,
        client: project.client,
        date: project.date,
        lines: project.lines,
        photos,
      })
    } catch (error) {
      toast.error('No se pudo preparar el PDF', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    }
  }

  async function handleSave(payload: {
    name: string
    client: string
    lines: ProjectLine[]
    photoFiles: File[]
    retainedPhotoIds: string[]
  }) {
    setSaving(true)
    try {
      if (draft.projectId) {
        await updateProject(draft.projectId, payload)
      } else {
        await createProject(payload)
      }
      const refreshed = await fetchProjects()
      setProjects(refreshed)
      setDraft(EMPTY_DRAFT)
      setView('home')
      toast.success(draft.projectId ? 'Proyecto actualizado' : 'Proyecto guardado', {
        description: `${payload.name} · ${totalUnits(payload.lines)} componentes · ${payload.photoFiles.length} foto${payload.photoFiles.length === 1 ? '' : 's'}.`,
      })
    } catch (error) {
      toast.error('No se pudo guardar el proyecto', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleAdjustStock(itemId: string, delta: number) {
    // Optimista: refleja el cambio ya mismo en la UI
    setStock((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    )
    try {
      await adjustStock(itemId, delta)
    } catch (error) {
      toast.error('No se pudo actualizar el stock', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
      // Revertir si falló
      const refreshed = await fetchStockItems()
      setStock(refreshed)
    }
  }

  async function handleCreateCatalogItem(input: {
    sku: string
    name: string
    categoryId: string
    spec?: string
    imageFile: File | null
  }) {
    const imageUrl = input.imageFile ? await uploadCatalogImage(input.imageFile) : undefined
    await createCatalogItem({
      sku: input.sku,
      name: input.name,
      categoryId: input.categoryId,
      spec: input.spec,
      image: imageUrl,
    })
    setCatalog(await fetchCatalogItems())
  }

  async function handleUpdateCatalogItem(
    id: string,
    input: { sku: string; name: string; categoryId: string; spec?: string; imageFile: File | null },
  ) {
    const imageUrl = input.imageFile ? await uploadCatalogImage(input.imageFile) : undefined
    await updateCatalogItem(id, {
      sku: input.sku,
      name: input.name,
      categoryId: input.categoryId,
      spec: input.spec,
      ...(imageUrl ? { image: imageUrl } : {}),
    })
    setCatalog(await fetchCatalogItems())
  }

  async function handleArchiveCatalogItem(id: string) {
    await archiveCatalogItem(id)
    setCatalog(await fetchCatalogItems())
  }

  async function handleCreateCatalogCategory(name: string) {
    const category = await createCatalogCategory(name)
    setCatalogCategories((current) => [...current, category])
    return category
  }

  async function handleCreateStockItem(input: {
    sku: string
    material: string
    categoryId: string
    unit: StockItem['unit']
    stock: number
    minStock: number
  }) {
    await createStockItem(input)
    setStock(await fetchStockItems())
  }

  async function handleUpdateStockItem(
    id: string,
    input: {
      sku: string
      material: string
      categoryId: string
      unit: StockItem['unit']
      minStock: number
    },
  ) {
    await updateStockItem(id, input)
    setStock(await fetchStockItems())
  }

  async function handleArchiveStockItem(id: string) {
    await archiveStockItem(id)
    setStock(await fetchStockItems())
  }

  async function handleCreateStockCategory(name: string) {
    const category = await createStockCategory(name)
    setStockCategories((current) => [...current, category])
    return category
  }

  async function handleSignOut() {
    await signOut()
    setProjects([])
    setStock([])
    setCatalog([])
    setView('home')
  }

  async function handleDeleteProject(projectId: string) {
    try {
      await archiveProject(projectId)
      setProjects((current) => current.filter((project) => project.id !== projectId))
      toast.success('Proyecto eliminado')
    } catch (error) {
      toast.error('No se pudo eliminar el proyecto', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </main>
    )
  }

  if (!userEmail) {
    return <LoginView onSuccess={() => { /* onAuthStateChange se encarga */ }} />
  }

  if (loadingData) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando datos del taller…</p>
      </main>
    )
  }

  if (view === 'create') {
    return (
      <CreateProjectView
        key={draftKey}
        catalog={catalog}
        catalogCategoryNames={catalogCategories.map((c) => c.name)}
        initialName={draft.name}
        initialClient={draft.client}
        initialLines={draft.lines}
        initialPhotos={draft.photos}
        isEditing={Boolean(draft.projectId)}
        onBack={() => setView('home')}
        onSave={handleSave}
        onExport={(input) => void handleExport(input)}
        saving={saving}
      />
    )
  }

  if (view === 'catalog') {
    return (
      <CatalogAdminView
        items={catalog}
        categories={catalogCategories}
        onBack={() => setView('home')}
        onCreate={handleCreateCatalogItem}
        onUpdate={handleUpdateCatalogItem}
        onArchive={handleArchiveCatalogItem}
        onCreateCategory={handleCreateCatalogCategory}
      />
    )
  }

  if (view === 'stock') {
    return (
      <StockView
        stock={stock}
        categories={stockCategories}
        onAdjust={handleAdjustStock}
        onCreate={handleCreateStockItem}
        onUpdate={handleUpdateStockItem}
        onArchive={handleArchiveStockItem}
        onCreateCategory={handleCreateStockCategory}
        onBack={() => setView('home')}
      />
    )
  }

  return (
    <HomeView
      projects={projects}
      lowStockCount={lowStockCount}
      userEmail={userEmail}
      onCreateProject={() => openDraft(EMPTY_DRAFT)}
      onOpenStock={() => setView('stock')}
      onManageCatalog={() => setView('catalog')}
      onViewProject={handleViewProject}
      onExportProject={(projectId) => void handleExportProject(projectId)}
      onDeleteProject={handleDeleteProject}
      onSignOut={handleSignOut}
    />
  )
}