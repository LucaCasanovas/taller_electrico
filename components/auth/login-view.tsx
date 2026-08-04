'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { signIn, signUp } from '@/lib/supabase/queries'

export function LoginView({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, fullName)
        toast.success('Cuenta creada', {
          description: 'Revisá tu email si se pide confirmación, o iniciá sesión.',
        })
      }
      onSuccess()
    } catch (error) {
      toast.error('No se pudo continuar', {
        description: error instanceof Error ? error.message : 'Intentá de nuevo.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </span>
          <CardTitle className="mt-2">
            {mode === 'login' ? 'Ingresar al taller' : 'Crear cuenta de empleado'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' ? (
              <Field>
                <FieldLabel htmlFor="full-name">Nombre y apellido</FieldLabel>
                <Input
                  id="full-name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading
                ? 'Un momento…'
                : mode === 'login'
                  ? 'Ingresar'
                  : 'Crear cuenta'}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login'
              ? '¿Sos nuevo en el taller? Creá tu cuenta'
              : '¿Ya tenés cuenta? Ingresá'}
          </button>
        </CardContent>
      </Card>
    </main>
  )
}
