'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2,
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  RefreshCw,
  Timer,
  Phone,
  LogOut,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

// Dynamic imports for charts (heavy recharts library)
const DailyTicketsChart = dynamic(
  () => import('@/components/charts/AnalyticsCharts').then(mod => ({ default: mod.DailyTicketsChart })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
)

const CategoryPieChart = dynamic(
  () => import('@/components/charts/AnalyticsCharts').then(mod => ({ default: mod.CategoryPieChart })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
)

const UrgencyPieChart = dynamic(
  () => import('@/components/charts/AnalyticsCharts').then(mod => ({ default: mod.UrgencyPieChart })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
)

const StatusPieChart = dynamic(
  () => import('@/components/charts/AnalyticsCharts').then(mod => ({ default: mod.StatusPieChart })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
)

const ResolutionTimeChart = dynamic(
  () => import('@/components/charts/AnalyticsCharts').then(mod => ({ default: mod.ResolutionTimeChart })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
)

interface User {
  dinasId: string
  dinasName: string
  categories: string[]
}

interface AnalyticsData {
  summary: {
    total: number
    resolved: number
    pending: number
    inProgress: number
    avgResolutionTimeHours: number
  }
  dailyData: { date: string; count: number }[]
  categoryData: { name: string; value: number }[]
  urgencyData: { name: string; value: number }[]
  statusData: { name: string; value: number }[]
  resolutionData: { category: string; avgHours: number }[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('30')

  // Memoize checkAuth to prevent recreating on every render
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()

      if (data.success) {
        setUser(data.data)
      } else {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Memoize fetchAnalytics
  const fetchAnalytics = useCallback(async () => {
    setDataLoading(true)
    try {
      const res = await fetch(`/api/analytics?days=${period}`)
      const data = await res.json()

      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setDataLoading(false)
    }
  }, [period])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, fetchAnalytics])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  // Memoize summary stats to prevent unnecessary re-renders
  const summaryStats = useMemo(() => {
    if (!analytics) return null
    return analytics.summary
  }, [analytics])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-background/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/s-logo.svg" alt="SatuPintu" width={30} height={30} />
            <div>
              <h1 className="font-bold text-lg text-white">SatuPintu</h1>
              <p className="text-xs text-muted-foreground">{user?.dinasName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="icon" className="bg-card border-white/10 hover:bg-white/5 text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Analitik Laporan</h1>
              <p className="text-muted-foreground">Statistik dan visualisasi data laporan</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-card border-white/10 text-white">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Hari Terakhir</SelectItem>
                <SelectItem value="14">14 Hari Terakhir</SelectItem>
                <SelectItem value="30">30 Hari Terakhir</SelectItem>
                <SelectItem value="90">90 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAnalytics}
              variant="outline"
              className="bg-card border-white/10 hover:bg-white/5 text-white"
              disabled={dataLoading}
            >
              {dataLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {dataLoading && !analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i} className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics && summaryStats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                      <p className="text-2xl font-bold text-white">{summaryStats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Selesai</p>
                      <p className="text-2xl font-bold text-white">{summaryStats.resolved}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Menunggu</p>
                      <p className="text-2xl font-bold text-white">{summaryStats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <RefreshCw className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Diproses</p>
                      <p className="text-2xl font-bold text-white">{summaryStats.inProgress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <Timer className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Rata-rata Waktu</p>
                      <p className="text-2xl font-bold text-white">{summaryStats.avgResolutionTimeHours}j</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Tickets Chart */}
              <Card className="bg-card border-white/5">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-white text-lg">Laporan Masuk per Hari</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {analytics.dailyData.length > 0 ? (
                    <DailyTicketsChart data={analytics.dailyData} />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Tidak ada data
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Pie Chart */}
              <Card className="bg-card border-white/5">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-white text-lg">Berdasarkan Kategori</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {analytics.categoryData.length > 0 ? (
                    <CategoryPieChart data={analytics.categoryData} />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Tidak ada data
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Urgency Pie Chart */}
              <Card className="bg-card border-white/5">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-white text-lg">Berdasarkan Urgensi</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {analytics.urgencyData.length > 0 ? (
                    <UrgencyPieChart data={analytics.urgencyData} />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Tidak ada data
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Pie Chart */}
              <Card className="bg-card border-white/5">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-white text-lg">Berdasarkan Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {analytics.statusData.length > 0 ? (
                    <StatusPieChart data={analytics.statusData} />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Tidak ada data
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resolution Time Chart - Full Width */}
              <Card className="bg-card border-white/5 lg:col-span-2">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-white text-lg">Rata-rata Waktu Penyelesaian (per Kategori)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {analytics.resolutionData.length > 0 ? (
                    <ResolutionTimeChart data={analytics.resolutionData} />
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Belum ada data penyelesaian
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Gagal memuat data analitik</p>
          </div>
        )}
      </main>
    </div>
  )
}
