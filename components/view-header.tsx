'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ViewHeaderProps = {
  eyebrow: string
  title: string
  onBack: () => void
  children?: React.ReactNode
}

export function ViewHeader({
  eyebrow,
  title,
  onBack,
  children,
}: ViewHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" />
            Volver al Inicio
          </Button>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="hidden flex-col sm:flex">
            <span className="font-mono text-[0.7rem] tracking-widest text-muted-foreground uppercase">
              {eyebrow}
            </span>
            <h1 className="text-sm leading-snug font-medium">{title}</h1>
          </div>
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </div>
    </header>
  )
}
