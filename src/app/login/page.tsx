'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">SatuPintu</CardTitle>
          <CardDescription>
            Login untuk mengakses dashboard dinas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="dinasId">ID Dinas</Label>
              <Input
                id="dinasId"
                placeholder="Contoh: pupr, polisi, dlh"
                value={dinasId}
                onChange={(e) => setDinasId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Masuk
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Dashboard untuk operator dinas. Warga dapat melacak laporan di{' '}
            <a href="/track/SP-00000000-0000" className="text-blue-600 hover:underline">
              halaman tracking
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
