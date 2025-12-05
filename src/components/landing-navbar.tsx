'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MobileNav } from './MobileNav'

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          "fixed z-50 left-1/2 -translate-x-1/2 transform-gpu transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] border backdrop-blur-xl",
          isScrolled 
            ? "top-4 w-[90%] max-w-5xl rounded-full border-white/10 bg-black/80 shadow-2xl"
            : "top-0 w-full max-w-full rounded-none border-transparent border-b-white/5 bg-background/60 shadow-none"
        )}
      >
        <div className={cn(
          "flex items-center justify-between w-full h-full mx-auto px-4 md:px-8 transition-all duration-700",
          "max-w-7xl",
          isScrolled ? "h-16" : "h-20"
        )}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">SatuPintu</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-white transition-colors">Fitur</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">Cara Kerja</Link>
            <Link href="/track/SP-20251203-0001" className="hover:text-white transition-colors">Lacak Laporan</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-white">
                Login Dinas
              </Button>
            </Link>
            <Button size="sm" className="hidden sm:flex bg-white text-black hover:bg-white/90 font-medium rounded-full">
              Lapor Sekarang
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>
      
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
