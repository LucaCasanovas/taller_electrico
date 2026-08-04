'use client'

import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  size?: 'sm' | 'default'
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  size = 'default',
  className,
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))
  const buttonSize = size === 'sm' ? 'icon-sm' : 'icon'

  return (
    <ButtonGroup className={className}>
      <Button
        variant="outline"
        size={buttonSize}
        aria-label={`Restar una unidad de ${label}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={`Cantidad de ${label}`}
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          onChange(clamp(Number.isNaN(parsed) ? min : parsed))
        }}
        className={cn(
          'w-14 border-y border-input bg-background text-center font-mono text-sm tabular-nums outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          size === 'sm' ? 'h-7' : 'h-8',
        )}
      />
      <Button
        variant="outline"
        size={buttonSize}
        aria-label={`Sumar una unidad de ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus />
      </Button>
    </ButtonGroup>
  )
}
