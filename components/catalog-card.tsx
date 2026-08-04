'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Check, Plus } from 'lucide-react'

import { QuantityStepper } from '@/components/quantity-stepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CatalogItem } from '@/lib/data'

type CatalogCardProps = {
  item: CatalogItem
  inProject: number
  onAdd: (quantity: number) => void
}

export function CatalogCard({ item, inProject, onAdd }: CatalogCardProps) {
  const [quantity, setQuantity] = useState(0)

  function handleAdd() {
    if (quantity < 1) return
    onAdd(quantity)
    setQuantity(0)
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:ring-primary/30">
      <div className="relative aspect-4/3 w-full bg-muted">
        <Image
          src={item.image || '/placeholder.svg'}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
        {inProject > 0 ? (
          <Badge className="absolute top-2 right-2 gap-1">
            <Check />
            {inProject}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm leading-snug font-medium text-pretty">
            {item.name}
          </h3>
          <p className="font-mono text-[0.7rem] tracking-wide text-muted-foreground">
            {item.sku}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {item.spec}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            label={item.name}
            size="sm"
            className="w-full [&>input]:w-full"
          />
          <Button size="sm" disabled={quantity === 0} onClick={handleAdd}>
            <Plus data-icon="inline-start" />
            Agregar al Proyecto
          </Button>
        </div>
      </div>
    </article>
  )
}
