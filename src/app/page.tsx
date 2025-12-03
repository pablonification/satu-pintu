import Link from 'next/link'
import { Phone, Search, Users, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">SatuPintu</span>
          </div>
          <Link 
            href="/login"
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Login Dinas
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 max-w-3xl mx-auto">
            Satu Nomor untuk{' '}
            <span className="text-blue-600">Semua Keluhan Kota</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Laporkan masalah kota via telepon, AI kami yang akan mengkategorikan dan meneruskan 
            ke dinas terkait. Lacak status laporan Anda kapan saja.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/track/SP-20251203-0001"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Search className="h-5 w-5" />
              Lacak Laporan
            </Link>
            <a
              href="tel:+6281234567890"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:border-blue-600 hover:text-blue-600 transition"
            >
              <Phone className="h-5 w-5" />
              Hubungi Sekarang
            </a>
          </div>

          {/* Demo Phone Number */}
          <div className="bg-blue-600 text-white rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-blue-100 mb-2">Nomor Pengaduan Terpadu</p>
            <p className="text-3xl font-bold mb-4">0812-3456-7890</p>
            <p className="text-blue-200 text-sm">
              Tersedia 24/7 untuk semua keluhan kota
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Cara Kerja</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Telepon</h3>
              <p className="text-gray-600">
                Hubungi satu nomor SatuPintu dan sampaikan keluhan Anda
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. AI Proses</h3>
              <p className="text-gray-600">
                AI kami memahami keluhan dan meneruskan ke dinas yang tepat
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Lacak</h3>
              <p className="text-gray-600">
                Terima SMS konfirmasi dan lacak status laporan kapan saja
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Keunggulan SatuPintu</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                'Satu nomor untuk semua jenis keluhan',
                'AI memahami Bahasa Indonesia',
                'Tiket otomatis diteruskan ke dinas terkait',
                'Lacak status via web atau SMS',
                'Notifikasi realtime setiap ada update',
                'Tersedia 24 jam sehari, 7 hari seminggu',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Jenis Laporan</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Darurat', desc: 'Kecelakaan, kebakaran, kejahatan', color: 'bg-red-100 text-red-800' },
              { name: 'Infrastruktur', desc: 'Jalan rusak, lampu mati', color: 'bg-orange-100 text-orange-800' },
              { name: 'Kebersihan', desc: 'Sampah, limbah, polusi', color: 'bg-green-100 text-green-800' },
              { name: 'Sosial', desc: 'ODGJ, lansia, anak terlantar', color: 'bg-purple-100 text-purple-800' },
              { name: 'Lainnya', desc: 'Keluhan lain', color: 'bg-gray-100 text-gray-800' },
            ].map((cat, i) => (
              <div key={i} className={`p-4 rounded-lg text-center ${cat.color}`}>
                <p className="font-semibold">{cat.name}</p>
                <p className="text-xs mt-1 opacity-80">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Punya Keluhan?</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Hubungi SatuPintu sekarang. Kami siap membantu.
            </p>
            <a
              href="tel:+6281234567890"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
            >
              <Phone className="h-6 w-6" />
              0812-3456-7890
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Phone className="h-4 w-4" />
          <span className="font-medium">SatuPintu</span>
        </div>
        <p>Layanan Pengaduan Terpadu Kota Bandung</p>
        <p className="mt-2">
          Ekraf Tech Summit 2025 - Tech Innovation Challenge
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/login" className="hover:text-blue-600">Login Dinas</Link>
          <span>|</span>
          <Link href="/track/SP-20251203-0001" className="hover:text-blue-600">Lacak Laporan</Link>
        </div>
      </footer>
    </div>
  )
}
