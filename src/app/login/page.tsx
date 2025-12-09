'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, AlertCircle } from 'lucide-react'
import Image from 'next/image'
export default function LoginPage() {
  const router = useRouter()
  const [dinasId, setDinasId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dinasId, password }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.error || 'Login gagal')
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
         <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center py-6">
            <Image src="/logo-white.svg" alt="SatuPintu" width={200} height={100} />
          </div>
          <CardDescription className="text-muted-foreground">
            Login untuk mengakses dashboard dinas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="dinasId" className="text-white">ID Dinas</Label>
              <Input
                id="dinasId"
                placeholder="Contoh: pupr, polisi, dlh"
                value={dinasId}
                onChange={(e) => setDinasId(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-white/20"
              />
            </div>

            <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Masuk
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Dashboard untuk operator dinas. Warga dapat melacak laporan di{' '}
            <a href="/track/SP-20251203-0001" className="text-white hover:underline">
              halaman tracking
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
