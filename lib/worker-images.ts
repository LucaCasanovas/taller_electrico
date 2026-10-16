/**
 * Imágenes de la vista trabajador (archivos estáticos en /public).
 *
 * Categorías → public/worker/categories/{slug}.png
 * Materiales → public/worker/materials/{slug}.png
 *
 * El slug es el nombre/SKU en minúsculas, sin acentos, espacios → guiones.
 * Ejemplos:
 *   "Cables y conductores" → cables-y-conductores.png
 *   SKU "Ca-Bla-75mm"      → ca-bla-75mm.png
 *
 * Usá siempre .png en minúsculas (Linux distingue mayúsculas).
 */

export function workerImageSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function workerCategoryImageSrc(categoryName: string) {
  const slug = workerImageSlug(categoryName)
  return slug ? `/worker/categories/${slug}.png` : '/placeholder.svg'
}

export function workerMaterialImageSrc(sku: string) {
  const slug = workerImageSlug(sku)
  return slug ? `/worker/materials/${slug}.png` : '/placeholder.svg'
}

/** True for la categoría de cables (no cablecanal). */
export function isCablesCategory(categoryName: string) {
  const slug = workerImageSlug(categoryName)
  return slug === 'cables' || /^cables?(?:-|$)/.test(slug)
}

/**
 * Secciones de cable estándar (mm²) que a veces se escribieron sin coma
 * multiplicando ×100: 75 → 0,75 · 150 → 1,5 · 250 → 2,5 · 50 → 0,5
 */
const FRACTIONAL_CABLE_SIZES = [0.5, 0.75, 1.5, 2.5] as const

/**
 * Formaliza una medida a un solo formato (coma decimal): 0,75mm · 2,5mm · 4mm
 * Une alias mal redactados: 75mm ≡ 0,75mm · 250mm ≡ 2,5mm
 */
export function canonicalizeCableMeasure(rawNumber: string): string | null {
  const hadDecimal = /[.,]/.test(rawNumber)
  const parsed = Number.parseFloat(rawNumber.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  let value = parsed

  if (!hadDecimal && Number.isInteger(parsed)) {
    const asHundredths = parsed / 100
    if (FRACTIONAL_CABLE_SIZES.some((size) => Math.abs(size - asHundredths) < 1e-9)) {
      value = asHundredths
    }
  }

  const label = Number.isInteger(value)
    ? String(value)
    : String(value).replace('.', ',')

  return `${label}mm`
}

function parseMeasureValue(label: string) {
  return Number.parseFloat(label.replace(',', '.').replace(/mm$/i, ''))
}

/**
 * Extrae la medida canónica desde SKU o nombre.
 * Ej.: "Ca-Ne-75mm" y "Cable 0,75mm" → ambos "0,75mm"
 */
export function extractCableMeasure(item: { sku: string; material: string }): string | null {
  const text = `${item.sku} ${item.material}`

  const withMm = text.match(/(\d+(?:[.,]\d+)?)\s*mm\b/i)
  if (withMm) return canonicalizeCableMeasure(withMm[1])

  // SKUs sin sufijo mm (ej. Ca-Vya-250)
  const skuTail = item.sku.match(/-(\d+(?:[.,]\d+)?)(?:mm)?$/i)
  if (skuTail) return canonicalizeCableMeasure(skuTail[1])

  return null
}

export function sortCableMeasures(measures: string[]) {
  return [...measures].sort((a, b) => {
    const na = parseMeasureValue(a)
    const nb = parseMeasureValue(b)
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
    return a.localeCompare(b, 'es')
  })
}
