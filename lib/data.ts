export type CatalogCategory = {
  id: string
  name: string
  sortOrder: number
}

export type CatalogItem = {
  id: string
  sku: string
  name: string
  categoryId: string
  category: string // nombre de la categoría, resuelto por el join
  spec: string | null
  image: string | null
  archived: boolean
}

export type StockCategory = {
  id: string
  name: string
  sortOrder: number
}

export type StockUnit = 'Metros' | 'Rollos' | 'Unidades' | 'Bolsas'

export type StockItem = {
  id: string
  sku: string
  material: string
  categoryId: string
  category: string
  stock: number
  unit: StockUnit
  minStock: number
  archived: boolean
}

export type ProjectLine = {
  itemId: string
  quantity: number
}

export type ProjectPhoto = {
  id: string
  name: string
  url: string
  file: File
}

export type Project = {
  id: string
  name: string
  client: string
  date: string
  lines: ProjectLine[]
  photos: number
}

export function totalUnits(lines: ProjectLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}
