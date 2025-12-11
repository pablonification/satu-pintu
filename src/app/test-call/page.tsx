'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Vapi from '@vapi-ai/web'
import type { CreateAssistantDTO } from '@vapi-ai/web/dist/api'
import { Phone, PhoneOff, Mic, MicOff, Loader2, AlertCircle, Settings, ArrowLeft, MoreVertical, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { getAssistantConfig, VAPI_PUBLIC_KEY } from '@/lib/vapi'
import { LandingNavbar } from '@/components/landing-navbar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type CallStatus = 'idle' | 'connecting' | 'active' | 'ending'

interface Message {
  role: 'assistant' | 'user' | 'system'
  content: string
  timestamp: Date
}

export default function TestCallPage() {
  const [vapi, setVapi] = useState<Vapi | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<'assistant' | 'user' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  
  // Configuration
  const [vapiPublicKey, setVapiPublicKey] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of transcript
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load config from localStorage or env
  useEffect(() => {
    const savedPublicKey = localStorage.getItem('vapi_public_key') || VAPI_PUBLIC_KEY || ''
    setVapiPublicKey(savedPublicKey)
    // Jika tidak ada key sama sekali, buka dialog config
    if (!savedPublicKey) {
      setIsConfigOpen(true)
    }
  }, [])

  // Save config
  const saveConfig = () => {
    localStorage.setItem('vapi_public_key', vapiPublicKey)
    setIsConfigOpen(false)
    setError(null)
  }

  const addMessage = useCallback((role: 'assistant' | 'user' | 'system', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }])
  }, [])

  // Initialize Vapi
  useEffect(() => {
    if (!vapiPublicKey) return

    const vapiInstance = new Vapi(vapiPublicKey)

    vapiInstance.on('call-start', () => {
      console.log('Call started')
      setCallStatus('active')
      setMessages([])
      addMessage('system', 'Panggilan terhubung. Silakan bicara.')
    })

    vapiInstance.on('call-end', () => {
      console.log('Call ended')
      setCallStatus('idle')
      setCurrentSpeaker(null)
      setVolumeLevel(0)
      addMessage('system', 'Panggilan berakhir.')
    })

    vapiInstance.on('speech-start', () => {
      setCurrentSpeaker('assistant')
    })

    vapiInstance.on('speech-end', () => {
      setCurrentSpeaker(null)
    })

    vapiInstance.on('volume-level', (level: number) => {
      setVolumeLevel(level)
    })

    vapiInstance.on('message', (message: { type: string; role?: string; transcript?: string; functionCall?: { name: string } }) => {
      if (message.type === 'transcript' && message.transcript) {
        const role = message.role === 'assistant' ? 'assistant' : 'user'
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1]
          if (lastMsg && lastMsg.role === role && (Date.now() - lastMsg.timestamp.getTime()) < 2000) {
            return [...prev.slice(0, -1), { ...lastMsg, content: message.transcript! }]
          }
          return [...prev, { role, content: message.transcript!, timestamp: new Date() }]
        })
      }

      if (message.type === 'function-call') {
         // Optional: Show function calls in transcript or debug log
         // addMessage('system', `System: ${message.functionCall?.name}`)
      }
    })

    vapiInstance.on('error', (error: Error) => {
      console.error('Vapi error:', error)
      let errorMessage = 'Terjadi kesalahan pada layanan suara.'
      
      if (error && typeof error === 'object') {
        const errObj = error as { message?: string; error?: string }
        errorMessage = errObj.message || errObj.error || errorMessage
      }
      
      setError(errorMessage)
      setCallStatus('idle')
    })

    setVapi(vapiInstance)

    return () => {
      vapiInstance.stop()
    }
  }, [vapiPublicKey, addMessage])

  const startCall = async () => {
    if (!vapi) {
        if (!vapiPublicKey) {
             setIsConfigOpen(true)
             return
        }
       // Re-init if needed or just handle error
       setError('Inisialisasi Vapi gagal. Coba refresh halaman.')
       return
    }

    try {
      setCallStatus('connecting')
      setError(null)
      
      const assistantConfig = getAssistantConfig()
      console.log('Starting call with config...')
      
      await vapi.start(assistantConfig as unknown as CreateAssistantDTO)
    } catch (err) {
      console.error('Failed to start call:', err)
      let errorMsg = 'Gagal memulai panggilan. Periksa koneksi internet dan izin mikrofon.'
      if (err instanceof Error) {
        errorMsg = err.message
      }
      setError(errorMsg)
      setCallStatus('idle')
    }
  }

  const endCall = () => {
    if (vapi) {
      setCallStatus('ending')
      vapi.stop()
    }
  }

  const toggleMute = () => {
    if (vapi) {
      const newMutedState = !isMuted
      vapi.setMuted(newMutedState)
      setIsMuted(newMutedState)
    }
  }

  // Visualizer Orb Component
  const Orb = () => {
    const isActive = callStatus === 'active'
    const isAssistant = currentSpeaker === 'assistant'
    // Smooth scale: clamp volume between 1.0 and 1.15 for subtle effect
    const smoothScale = isActive ? 1 + Math.min(volumeLevel * 0.5, 0.15) : 1
    
    return (
        <div className="relative flex items-center justify-center h-72 w-72 mx-auto my-4">
            
            {/* Outer Glow Ring 1 */}
            <div 
                className={`absolute w-44 h-44 rounded-full transition-all duration-700 ease-out ${
                    isActive 
                        ? (isAssistant ? 'bg-indigo-500/20' : 'bg-emerald-500/20') 
                        : 'bg-white/5'
                }`}
                style={{
                    transform: `scale(${isActive ? 1.4 + volumeLevel * 0.3 : 1})`,
                    filter: 'blur(20px)'
                }}
            />
            
            {/* Outer Glow Ring 2 */}
            <div 
                className={`absolute w-44 h-44 rounded-full transition-all duration-500 ease-out ${
                    isActive 
                        ? (isAssistant ? 'bg-indigo-500/10' : 'bg-emerald-500/10') 
                        : 'bg-transparent'
                }`}
                style={{
                    transform: `scale(${isActive ? 1.6 + volumeLevel * 0.4 : 1})`,
                    filter: 'blur(30px)'
                }}
            />

            {/* Pulsing Ring (CSS animation, subtle) */}
            {isActive && (
                <div 
                    className={`absolute w-36 h-36 rounded-full border-2 animate-ping ${
                        isAssistant ? 'border-indigo-500/30' : 'border-emerald-500/30'
                    }`}
                    style={{ animationDuration: '2s' }}
                />
            )}

            {/* Main Orb */}
            <div 
                className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl z-10 transition-all duration-300 ease-out ${
                    isActive 
                        ? (isAssistant ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600') 
                        : (callStatus === 'connecting' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-zinc-800')
                }`}
                style={{
                    transform: `scale(${callStatus === 'connecting' ? 1 : smoothScale})`,
                    boxShadow: isActive 
                        ? (isAssistant 
                            ? `0 0 60px rgba(99, 102, 241, ${0.3 + volumeLevel * 0.3})` 
                            : `0 0 60px rgba(16, 185, 129, ${0.3 + volumeLevel * 0.3})`)
                        : 'none'
                }}
            >
                {callStatus === 'connecting' ? (
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                ) : isActive ? (
                    isAssistant ? (
                        <Volume2 className="h-10 w-10 text-white drop-shadow-lg" />
                    ) : (
                        <Mic className="h-10 w-10 text-white drop-shadow-lg" />
                    )
                ) : (
                    <Phone className="h-10 w-10 text-white/50" />
                )}
            </div>
            
            {/* Status Label */}
            <div className="absolute -bottom-6 left-0 right-0 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    {callStatus === 'idle' && 'Siap Menelepon'}
                    {callStatus === 'connecting' && 'Menghubungkan...'}
                    {callStatus === 'active' && (currentSpeaker === 'assistant' ? 'AI Berbicara' : 'Mendengarkan...')}
                    {callStatus === 'ending' && 'Mengakhiri...'}
                </p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Background Elements from Landing Page */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
         <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
         <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-indigo-500/10 blur-[100px] mx-auto" />
      </div>

      <LandingNavbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-24 sm:pt-32 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
           <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
           </Link>
           <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4">
             Voice AI Demo
           </h1>
           <p className="text-lg text-muted-foreground">
             Cobalah berbicara dengan AI SatuPintu. Laporkan masalah kota Anda secara natural.
           </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl h-[600px] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            
            {/* Left Panel: Call Interface */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-md flex flex-col justify-between overflow-hidden relative">
                {/* Config Button (Absolute) */}
                <div className="absolute top-4 right-4 z-20">
                    <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Konfigurasi Vapi</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">Vapi Public Key</Label>
                                    <Input 
                                        id="apiKey" 
                                        value={vapiPublicKey}
                                        onChange={(e) => setVapiPublicKey(e.target.value)}
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        className="bg-zinc-900 border-white/10"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Dapatkan Public Key dari <a href="https://dashboard.vapi.ai" className="text-indigo-400 hover:underline">dashboard.vapi.ai</a>.
                                    </p>
                                </div>
                                <Button onClick={saveConfig} className="w-full">Simpan</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 relative">
                    
                    {/* Visualizer */}
                    <Orb />

                    {/* Error Message */}
                    {error && (
                        <div className="absolute top-16 left-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                </CardContent>

                {/* Controls */}
                <div className="p-8 border-t border-white/5 bg-white/5 flex justify-center gap-6">
                    {callStatus === 'idle' ? (
                        <Button 
                            onClick={startCall} 
                            size="lg" 
                            className="h-16 px-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-105"
                        >
                            <Phone className="mr-2 h-5 w-5" />
                            Mulai Panggilan
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={toggleMute}
                                variant="outline"
                                size="icon"
                                className={`h-16 w-16 rounded-full border-white/10 transition-all ${
                                    isMuted ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 hover:bg-white/10 text-white'
                                }`}
                            >
                                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                            </Button>
                            
                            <Button
                                onClick={endCall}
                                variant="destructive"
                                size="icon"
                                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all hover:scale-105"
                                disabled={callStatus === 'ending'}
                            >
                                <PhoneOff className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            {/* Right Panel: Transcript & Info */}
            <div className="flex flex-col gap-6 h-full">
                 {/* Transcript Area */}
                 <Card className="flex-1 border-white/10 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <MoreVertical className="h-4 w-4 text-indigo-400" />
                            Live Transcript
                        </h3>
                        {callStatus === 'active' && (
                             <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 animate-pulse">
                                Live
                             </Badge>
                        )}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8 opacity-50">
                                <p className="mb-2">Belum ada percakapan</p>
                                <p className="text-sm">Mulai panggilan untuk melihat transkrip secara real-time.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                            msg.role === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-br-sm' 
                                                : msg.role === 'assistant'
                                                ? 'bg-white/10 text-gray-200 rounded-bl-sm'
                                                : 'bg-transparent text-gray-500 text-xs italic w-full text-center'
                                        }`}>
                                            {msg.role !== 'system' && (
                                                <p className="text-[10px] opacity-70 mb-1 uppercase tracking-wider font-bold">
                                                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                                </p>
                                            )}
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                 </Card>

                 {/* Quick Tips */}
                 <Card className="h-auto border-white/10 bg-indigo-950/20 backdrop-blur-md p-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hidden sm:block">
                            <Volume2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-white mb-1">Topik Percakapan</h4>
                            <p className="text-xs text-muted-foreground">
                                Coba laporkan masalah seperti: 
                                <span className="text-indigo-300"> "Lampu jalan mati di Jalan Dago"</span>, 
                                <span className="text-indigo-300"> "Ada tumpukan sampah liar"</span>, atau 
                                <span className="text-indigo-300"> "Lubang besar di jalan utama"</span>.
                            </p>
                        </div>
                    </div>
                 </Card>
            </div>
        </div>
      </main>
    </div>
  )
}
