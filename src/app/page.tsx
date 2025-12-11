import Link from 'next/link'
import { Phone, Search, Zap, Shield, Activity, ArrowRight, CheckCircle2, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingNavbar } from '@/components/landing-navbar'
import Image from 'next/image'
import { CallFlowAnimation } from '@/components/CallFlowAnimation'

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-indigo-500/10 blur-[100px] mx-auto" />
      </div>

      <LandingNavbar />

      <main className="flex-1 pt-24 sm:pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center relative z-10 pb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Layanan Pengaduan Aktif 24/7
          </div>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Satu Nomor untuk <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              Semua Keluhan Kota
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 leading-relaxed">
            Revolusi layanan publik dengan kecerdasan buatan. Laporkan masalah via telepon, 
            AI kami akan mengurus sisanya. Cepat, tepat, dan transparan.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <Link href="/test-call">
              <Button size="lg" className="h-12 px-8 bg-white text-black hover:bg-white/90 text-base rounded-full">
                <Phone className="mr-2 h-4 w-4" />
                Coba Demo Sekarang
              </Button>
            </Link>
            <Link href="/track/SP-20251203-0001">
              <Button
                size="lg"
                className="h-12 px-8 bg-black text-white hover:bg-black/90 text-base rounded-full"
              >
                <Search className="mr-2 h-4 w-4" />
                Lacak Status
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview / Call Flow Animation */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-24 duration-1000 delay-700">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20"></div>
            <div className="relative rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden aspect-[16/9] shadow-2xl">
              <CallFlowAnimation />
            </div>
          </div>
        </section>

        {/* Features Grid (Bento Style) */}
        <section id="features" className="container mx-auto px-4 py-24 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Dibangun untuk Efisiensi</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Teknologi canggih yang bekerja di belakang layar untuk memastikan setiap laporan
              ditangani dengan prioritas yang tepat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Large Card */}
            <div className="md:col-span-2 row-span-2 rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6">
                    <Zap className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">AI-Powered Routing</h3>
                  <p className="text-muted-foreground text-lg">
                    Sistem kami secara otomatis menganalisis isi percakapan, mendeteksi urgensi,
                    dan meneruskan laporan ke dinas terkait dalam hitungan detik. Tanpa operator manual.
                  </p>
                </div>
                <div className="mt-8 flex gap-2">
                    <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-indigo-300 border border-indigo-500/30">NLP</div>
                    <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-indigo-300 border border-indigo-500/30">Voice Recognition</div>
                    <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-indigo-300 border border-indigo-500/30">Auto-Triage</div>
                </div>
              </div>
            </div>

            {/* Small Card 1 */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-colors group relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Tracking</h3>
              <p className="text-muted-foreground text-sm">
                Pantau status laporan Anda secara langsung. Transparansi penuh dari awal hingga selesai.
              </p>
            </div>

            {/* Small Card 2 */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-colors group relative overflow-hidden">
               <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Verified & Secure</h3>
              <p className="text-muted-foreground text-sm">
                Setiap laporan diverifikasi untuk mencegah spam. Data pelapor dilindungi dengan enkripsi standar industri.
              </p>
            </div>

             {/* Wide Card */}
             <div className="md:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-colors group relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                     <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                        <Globe2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Multi-Channel Support</h3>
                    <p className="text-muted-foreground">
                        Selain telepon, SatuPintu terintegrasi dengan WhatsApp dan Web Portal. 
                        Semua saluran bermuara ke satu sistem manajemen terpusat.
                    </p>
                </div>
                <div className="flex-1 w-full">
                    <div className="grid grid-cols-2 gap-4">
                        {['Layanan Darurat', 'Perbaikan Jalan', 'Lampu PJU', 'Sampah & Kebersihan'].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                                <span className="text-sm text-gray-300">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="report" className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950/20 pointer-events-none" />
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Siap untuk melaporkan masalah?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Jangan biarkan masalah kota berlarut-larut. Hubungi kami sekarang dan
                        jadilah bagian dari perubahan.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/test-call" className="w-full sm:w-auto relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                             <Button size="lg" className="relative w-full h-16 px-10 bg-white text-black hover:bg-indigo-50 text-xl font-bold rounded-full shadow-2xl transition-all duration-300 hover:-translate-y-1 ring-1 ring-white/50">
                                <span className="flex items-center gap-3">
                                    Coba Sekarang
                                    <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-muted-foreground">
                        Bebas pulsa untuk operator tertentu • Tersedia 24 Jam
                    </p>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <Image src="/logo-white.svg" alt="SatuPintu" width={120} height={60} />
            
            <div className="text-sm text-muted-foreground">
                © 2025 SatuPintu • Labtek V
            </div>

            <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                {/* <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms</Link> */}
                <Link href="mailto:arqilasp@gmail.com" target="_blank" className="hover:text-white transition-colors">Contact</Link>
            </div>
        </div>
      </footer>
    </div>
  )
}