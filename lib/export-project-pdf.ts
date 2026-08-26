'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import type { CatalogItem, ProjectLine, ProjectPhoto } from '@/lib/data'

export type ProjectPdfInput = {
  name: string
  client: string
  date?: string
  lines: ProjectLine[]
  photos: ProjectPhoto[]
  catalog: CatalogItem[]
}

async function imageToJpeg(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`No se pudo cargar la imagen: ${response.status}`)

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = objectUrl
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('No se pudo procesar una imagen'))
    })

    const maxDimension = 1600
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo preparar la imagen')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.82),
      width: canvas.width,
      height: canvas.height,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function addImageContain(
  document: jsPDF,
  image: { dataUrl: string; width: number; height: number },
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height)
  const width = image.width * scale
  const height = image.height * scale
  document.addImage(image.dataUrl, 'JPEG', x + (maxWidth - width) / 2, y, width, height)
  return height
}

export async function exportProjectPdf(input: ProjectPdfInput) {
  const document = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 15
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()

  document.setTextColor(30, 30, 30)
  document.setFontSize(20)
  document.text(input.name || 'Proyecto sin nombre', margin, 20)
  document.setFontSize(10)
  document.setTextColor(90, 90, 90)
  document.text(`Cliente: ${input.client || 'Sin cliente asignado'}`, margin, 28)
  document.text(`Fecha: ${input.date ?? new Date().toLocaleDateString('es-AR')}`, margin, 34)

  const rows = input.lines.map((line) => {
    const item = input.catalog.find((catalogItem) => catalogItem.id === line.itemId)
    return [
      item?.name ?? 'Componente no disponible',
      item?.sku ?? '-',
      item?.category ?? '-',
      item?.spec ?? '-',
      String(line.quantity),
    ]
  })

  autoTable(document, {
    startY: 42,
    margin: { left: margin, right: margin },
    head: [['Componente', 'SKU', 'Categoría', 'Especificación', 'Cantidad']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 30, 30] },
    headStyles: { fillColor: [35, 35, 35], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 4: { halign: 'right' } },
  })

  const tableEnd = (document as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 42
  document.setFontSize(10)
  document.setTextColor(30, 30, 30)
  document.text(
    `Total de componentes: ${input.lines.reduce((sum, line) => sum + line.quantity, 0)}`,
    margin,
    tableEnd + 10,
  )

  if (input.photos.length > 0) {
    document.addPage()
    document.setFontSize(16)
    document.text('Evidencia fotográfica', margin, 20)

    let y = 28
    const columnGap = 6
    const columnWidth = (pageWidth - margin * 2 - columnGap) / 2
    const imageHeight = 72

    for (const [index, photo] of input.photos.entries()) {
      try {
        const image = await imageToJpeg(photo.url)
        const column = index % 2
        if (column === 0 && index > 0) y += imageHeight + 17
        if (y + imageHeight > pageHeight - margin) {
          document.addPage()
          document.setFontSize(16)
          document.text('Evidencia fotográfica', margin, 20)
          y = 28
        }
        const x = margin + column * (columnWidth + columnGap)
        addImageContain(document, image, x, y, columnWidth, imageHeight)
        document.setFontSize(8)
        document.setTextColor(90, 90, 90)
        document.text(photo.name, x, y + imageHeight + 5, { maxWidth: columnWidth })
      } catch {
        document.setFontSize(8)
        document.setTextColor(150, 50, 50)
        document.text(`No se pudo cargar: ${photo.name}`, margin, y + 8)
      }
    }
  }

  const fileName = `${(input.name || 'proyecto').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`
  document.save(fileName)
}
