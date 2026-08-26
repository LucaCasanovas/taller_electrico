'use client'

import { useId, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ProjectPhoto } from '@/lib/data'
import { cn } from '@/lib/utils'

type PhotoEvidenceProps = {
  photos: ProjectPhoto[]
  onAdd: (files: File[]) => void
  onRemove: (photoId: string) => void
}

export function PhotoEvidence({ photos, onAdd, onRemove }: PhotoEvidenceProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null)

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const images = Array.from(fileList).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (images.length > 0) onAdd(images)
  }

  const selectedPhotoIndex = selectedPhoto
    ? photos.findIndex((photo) => photo.id === selectedPhoto.id)
    : -1

  function showPreviousPhoto() {
    if (selectedPhotoIndex < 0) return
    const previousIndex = (selectedPhotoIndex - 1 + photos.length) % photos.length
    setSelectedPhoto(photos[previousIndex])
  }

  function showNextPhoto() {
    if (selectedPhotoIndex < 0) return
    const nextIndex = (selectedPhotoIndex + 1) % photos.length
    setSelectedPhoto(photos[nextIndex])
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center gap-2 rounded-xl border border-dashed border-input px-4 py-6 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Camera className="size-4" />
        </span>
        <p className="text-sm font-medium">Arrastrá las fotos del tablero</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          JPG o PNG · frente, interior y bornera terminada
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() => inputRef.current?.click()}
        >
          <Upload data-icon="inline-start" />
          Seleccionar archivos
        </Button>
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
            >
              <button
                type="button"
                className="size-full cursor-zoom-in"
                aria-label={`Ver ${photo.name}`}
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url || '/placeholder.svg'}
                  alt={photo.name}
                  className="size-full object-cover"
                />
              </button>
              <Button
                variant="destructive"
                size="icon-xs"
                aria-label={`Eliminar ${photo.name}`}
                onClick={() => onRemove(photo.id)}
                className="absolute top-1 right-1 bg-background/90 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.name}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative flex max-h-full max-w-5xl items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Ver imagen anterior"
              className="shrink-0"
              onClick={showPreviousPhoto}
            >
              <ArrowLeft />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.url || '/placeholder.svg'}
              alt={selectedPhoto.name}
              className="max-h-[85svh] max-w-full object-contain"
            />
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Ver imagen siguiente"
              className="shrink-0"
              onClick={showNextPhoto}
            >
              <ArrowRight />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Cerrar vista de imagen"
              className="absolute top-2 right-14"
              onClick={() => setSelectedPhoto(null)}
            >
              <X />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
