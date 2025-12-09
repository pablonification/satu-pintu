'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[80%] max-w-sm bg-card border-l border-white/10 p-6 md:hidden shadow-2xl"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Image src="/logo-white.svg" alt="SatuPintu" width={120} height={60} />
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <nav className="flex flex-col gap-6 text-lg font-medium text-muted-foreground flex-1">
                <Link href="/" onClick={onClose} className="hover:text-white transition-colors">
                  Beranda
                </Link>
                <Link href="#features" onClick={onClose} className="hover:text-white transition-colors">
                  Fitur
                </Link>
                <Link href="#report" onClick={onClose} className="hover:text-white transition-colors">
                  Lapor
                </Link>
                <Link href="#how-it-works" onClick={onClose} className="hover:text-white transition-colors">
                  Cara Kerja
                </Link>
                <Link href="/track/SP-20251203-0001" onClick={onClose} className="hover:text-white transition-colors">
                  Lacak Laporan
                </Link>
                <Link href="/login" onClick={onClose} className="hover:text-white transition-colors">
                  Login Dinas
                </Link>
              </nav>

              <div className="mt-auto pt-8 border-t border-white/10">
                <Button className="w-full bg-white text-black hover:bg-white/90 font-medium rounded-full py-6 text-lg">
                  Lapor Sekarang
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
