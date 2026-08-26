import { createClient } from '@/lib/supabase/client'
import type {
  CatalogCategory,
  CatalogItem,
  Project,
  ProjectLine,
  ProjectPhoto,
  StockCategory,
  StockItem,
  StockUnit,
} from '@/lib/data'

// ------------------------------------------------------------
// Auth
// ------------------------------------------------------------
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

// ------------------------------------------------------------
// Catálogo (componentes de tablero)
// ------------------------------------------------------------
export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('catalog_categories')
    .select('id, name, sort_order')
    .order('sort_order')
  if (error) throw error
  return data.map((row) => ({ id: row.id, name: row.name, sortOrder: row.sort_order }))
}

export async function fetchCatalogItems(): Promise<CatalogItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('catalog_items')
    .select('id, sku, name, spec, image_url, archived, category_id, catalog_categories(name)')
    .eq('archived', false)
    .order('name')
  if (error) throw error
  return data.map((row: any) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    categoryId: row.category_id,
    category: row.catalog_categories?.name ?? '',
    spec: row.spec,
    image: row.image_url,
    archived: row.archived,
  }))
}

export async function createCatalogCategory(name: string): Promise<CatalogCategory> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('catalog_categories')
    .insert({ name, sort_order: 999 })
    .select('id, name, sort_order')
    .single()
  if (error) throw error
  return { id: data.id, name: data.name, sortOrder: data.sort_order }
}

export async function uploadCatalogImage(file: File): Promise<string> {
  const supabase = createClient()
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from('catalog-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('catalog-images').getPublicUrl(path)
  return data.publicUrl
}

export async function createCatalogItem(input: {
  sku: string
  name: string
  categoryId: string
  spec?: string
  image?: string
}) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('catalog_items').insert({
    sku: input.sku,
    name: input.name,
    category_id: input.categoryId,
    spec: input.spec ?? null,
    image_url: input.image ?? null,
    created_by: userData.user?.id,
  })
  if (error) throw error
}

export async function updateCatalogItem(
  id: string,
  input: Partial<{ sku: string; name: string; categoryId: string; spec: string; image: string }>,
) {
  const supabase = createClient()
  const { error } = await supabase
    .from('catalog_items')
    .update({
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
      ...(input.spec !== undefined ? { spec: input.spec } : {}),
      ...(input.image !== undefined ? { image_url: input.image } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function archiveCatalogItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('catalog_items').update({ archived: true }).eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------
// Stock a granel
// ------------------------------------------------------------
export async function fetchStockCategories(): Promise<StockCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stock_categories')
    .select('id, name, sort_order')
    .order('sort_order')
  if (error) throw error
  return data.map((row) => ({ id: row.id, name: row.name, sortOrder: row.sort_order }))
}

export async function createStockCategory(name: string): Promise<StockCategory> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stock_categories')
    .insert({ name, sort_order: 999 })
    .select('id, name, sort_order')
    .single()
  if (error) throw error
  return { id: data.id, name: data.name, sortOrder: data.sort_order }
}

export async function fetchStockItems(): Promise<StockItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stock_items')
    .select(
      'id, sku, material, unit, stock, min_stock, archived, category_id, stock_categories(name)',
    )
    .eq('archived', false)
    .order('material')
  if (error) throw error
  return data.map((row: any) => ({
    id: row.id,
    sku: row.sku,
    material: row.material,
    categoryId: row.category_id,
    category: row.stock_categories?.name ?? '',
    stock: Number(row.stock),
    unit: row.unit as StockUnit,
    minStock: Number(row.min_stock),
    archived: row.archived,
  }))
}

export async function createStockItem(input: {
  sku: string
  material: string
  categoryId: string
  unit: StockUnit
  stock: number
  minStock: number
}) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('stock_items').insert({
    sku: input.sku,
    material: input.material,
    category_id: input.categoryId,
    unit: input.unit,
    stock: input.stock,
    min_stock: input.minStock,
    created_by: userData.user?.id,
  })
  if (error) throw error
}

export async function updateStockItem(
  id: string,
  input: Partial<{
    sku: string
    material: string
    categoryId: string
    unit: StockUnit
    minStock: number
  }>,
) {
  const supabase = createClient()
  const { error } = await supabase
    .from('stock_items')
    .update({
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.material !== undefined ? { material: input.material } : {}),
      ...(input.categoryId !== undefined ? { category_id: input.categoryId } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.minStock !== undefined ? { min_stock: input.minStock } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function archiveStockItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('stock_items').update({ archived: true }).eq('id', id)
  if (error) throw error
}

// Ajuste atómico de stock (usa la función SQL adjust_stock, ver
// supabase/02_storage_and_functions.sql) y deja registrado el
// movimiento con el usuario que lo hizo.
export async function adjustStock(itemId: string, delta: number, reason?: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('adjust_stock', {
    p_item_id: itemId,
    p_delta: delta,
    p_reason: reason ?? null,
  })
  if (error) throw error
}

// ------------------------------------------------------------
// Proyectos
// ------------------------------------------------------------
export async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, name, client, created_at, project_lines(catalog_item_id, quantity), project_photos(id)',
    )
    .eq('status', 'activo')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    client: row.client ?? '',
    date: (row.created_at as string).slice(0, 10),
    lines: (row.project_lines ?? []).map((line: any) => ({
      itemId: line.catalog_item_id,
      quantity: Number(line.quantity),
    })) as ProjectLine[],
    photos: (row.project_photos ?? []).length,
  }))
}

function projectPhotoUrl(path: string) {
  const supabase = createClient()
  return supabase.storage.from('project-photos').getPublicUrl(path).data.publicUrl
}

export async function fetchProjectPhotos(projectId: string): Promise<ProjectPhoto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_photos')
    .select('id, storage_path, file_name')
    .eq('project_id', projectId)
    .order('created_at')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.file_name ?? 'Foto del proyecto',
    url: projectPhotoUrl(row.storage_path),
  }))
}

export async function createProject(payload: {
  name: string
  client: string
  lines: ProjectLine[]
  photoFiles: File[]
}) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ name: payload.name, client: payload.client, created_by: userId })
    .select('id')
    .single()
  if (projectError) throw projectError

  if (payload.lines.length > 0) {
    const { error: linesError } = await supabase.from('project_lines').insert(
      payload.lines.map((line) => ({
        project_id: project.id,
        catalog_item_id: line.itemId,
        quantity: line.quantity,
      })),
    )
    if (linesError) throw linesError
  }

  for (const file of payload.photoFiles) {
    const path = `${project.id}/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('project-photos')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { error: photoRowError } = await supabase.from('project_photos').insert({
      project_id: project.id,
      storage_path: path,
      file_name: file.name,
      uploaded_by: userId,
    })
    if (photoRowError) throw photoRowError
  }

  return project.id as string
}

export async function updateProject(
  projectId: string,
  payload: {
    name: string
    client: string
    lines: ProjectLine[]
    photoFiles: File[]
    retainedPhotoIds: string[]
  },
) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  const { error: projectError } = await supabase
    .from('projects')
    .update({ name: payload.name, client: payload.client, updated_at: new Date().toISOString() })
    .eq('id', projectId)
  if (projectError) throw projectError

  const { error: deleteLinesError } = await supabase
    .from('project_lines')
    .delete()
    .eq('project_id', projectId)
  if (deleteLinesError) throw deleteLinesError

  if (payload.lines.length > 0) {
    const { error: linesError } = await supabase.from('project_lines').insert(
      payload.lines.map((line) => ({
        project_id: projectId,
        catalog_item_id: line.itemId,
        quantity: line.quantity,
      })),
    )
    if (linesError) throw linesError
  }

  const { data: currentPhotos, error: currentPhotosError } = await supabase
    .from('project_photos')
    .select('id, storage_path')
    .eq('project_id', projectId)
  if (currentPhotosError) throw currentPhotosError

  const photosToDelete = (currentPhotos ?? []).filter(
    (photo) => !payload.retainedPhotoIds.includes(photo.id),
  )
  if (photosToDelete.length > 0) {
    const { error: deletePhotosError } = await supabase
      .from('project_photos')
      .delete()
      .in('id', photosToDelete.map((photo) => photo.id))
    if (deletePhotosError) throw deletePhotosError
    const { error: deleteStorageError } = await supabase.storage
      .from('project-photos')
      .remove(photosToDelete.map((photo) => photo.storage_path))
    if (deleteStorageError) throw deleteStorageError
  }

  for (const file of payload.photoFiles) {
    const path = `${projectId}/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('project-photos').upload(path, file)
    if (uploadError) throw uploadError
    const { error: photoRowError } = await supabase.from('project_photos').insert({
      project_id: projectId,
      storage_path: path,
      file_name: file.name,
      uploaded_by: userId,
    })
    if (photoRowError) throw photoRowError
  }
}

export async function archiveProject(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('projects').update({ status: 'archivado' }).eq('id', id)
  if (error) throw error
}
