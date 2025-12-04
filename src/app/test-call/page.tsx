'use client'

import { useState, useEffect, useCallback } from 'react'
import Vapi from '@vapi-ai/web'
import { Phone, PhoneOff, Mic, MicOff, Loader2, AlertCircle, Volume2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

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
  const [assistantId, setAssistantId] = useState('')
  const [showConfig, setShowConfig] = useState(true)

  // Load config from localStorage
  useEffect(() => {
    const savedPublicKey = localStorage.getItem('vapi_public_key') || ''
    const savedAssistantId = localStorage.getItem('vapi_assistant_id') || ''
    setVapiPublicKey(savedPublicKey)
    setAssistantId(savedAssistantId)
    if (savedPublicKey && savedAssistantId) {
      setShowConfig(false)
    }
  }, [])

  // Save config to localStorage
  const saveConfig = () => {
    localStorage.setItem('vapi_public_key', vapiPublicKey)
    localStorage.setItem('vapi_assistant_id', assistantId)
    setShowConfig(false)
    setError(null)
  }

  const addMessage = useCallback((role: 'assistant' | 'user' | 'system', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }])
  }, [])

  // Initialize Vapi
  useEffect(() => {
    if (!vapiPublicKey) return

    const vapiInstance = new Vapi(vapiPublicKey)

    // Event listeners
    vapiInstance.on('call-start', () => {
      console.log('Call started')
      setCallStatus('active')
      setMessages([])
      addMessage('system', 'Panggilan dimulai...')
    })

    vapiInstance.on('call-end', () => {
      console.log('Call ended')
      setCallStatus('idle')
      setCurrentSpeaker(null)
      addMessage('system', 'Panggilan berakhir')
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
      console.log('Vapi message:', message)
      
      if (message.type === 'transcript' && message.transcript) {
        const role = message.role === 'assistant' ? 'assistant' : 'user'
        // Update or add message
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1]
          if (lastMsg && lastMsg.role === role && (Date.now() - lastMsg.timestamp.getTime()) < 2000) {
            // Update last message if same role and within 2 seconds
            return [...prev.slice(0, -1), { ...lastMsg, content: message.transcript! }]
          }
          return [...prev, { role, content: message.transcript!, timestamp: new Date() }]
        })
      }

      if (message.type === 'function-call') {
        addMessage('system', `Memproses: ${message.functionCall?.name}...`)
      }
    })

    vapiInstance.on('error', (error: Error) => {
      console.error('Vapi error:', error)
      setError(error.message || 'Terjadi kesalahan')
      setCallStatus('idle')
    })

    setVapi(vapiInstance)

    return () => {
      vapiInstance.stop()
    }
  }, [vapiPublicKey, addMessage])

  const startCall = async () => {
    if (!vapi || !assistantId) {
      setError('Konfigurasi Vapi belum lengkap')
      setShowConfig(true)
      return
    }

    try {
      setCallStatus('connecting')
      setError(null)
      await vapi.start(assistantId)
    } catch (err) {
      console.error('Failed to start call:', err)
      setError('Gagal memulai panggilan. Pastikan konfigurasi Vapi sudah benar.')
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
      if (isMuted) {
        vapi.setMuted(false)
      } else {
        vapi.setMuted(true)
      }
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 mb-4">
              <Phone className="h-3 w-3" />
              Voice AI Demo
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Test Panggilan SatuPintu</h1>
            <p className="text-muted-foreground">
              Simulasi panggilan dengan AI Assistant menggunakan Vapi
            </p>
          </div>

          {/* Configuration Panel */}
          {showConfig && (
            <Card className="mb-6 bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Konfigurasi Vapi
                </CardTitle>
                <CardDescription>
                  Masukkan kredensial Vapi Anda. Dapatkan di{' '}
                  <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    dashboard.vapi.ai
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="publicKey">Public Key</Label>
                  <Input
                    id="publicKey"
                    value={vapiPublicKey}
                    onChange={(e) => setVapiPublicKey(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="bg-background/50 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="assistantId">Assistant ID</Label>
                  <Input
                    id="assistantId"
                    value={assistantId}
                    onChange={(e) => setAssistantId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="bg-background/50 mt-1"
                  />
                </div>
                <Button onClick={saveConfig} className="w-full" disabled={!vapiPublicKey || !assistantId}>
                  Simpan Konfigurasi
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Call Interface */}
          <Card className="mb-6 bg-card/50 border-white/10">
            <CardContent className="pt-6">
              {/* Call Status Display */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 transition-all ${
                  callStatus === 'active' 
                    ? 'bg-green-500/20 ring-4 ring-green-500/30' 
                    : callStatus === 'connecting' 
                    ? 'bg-yellow-500/20 ring-4 ring-yellow-500/30 animate-pulse'
                    : 'bg-white/5'
                }`}>
                  {callStatus === 'connecting' ? (
                    <Loader2 className="h-16 w-16 text-yellow-400 animate-spin" />
                  ) : callStatus === 'active' ? (
                    <div className="relative">
                      <Phone className="h-16 w-16 text-green-400" />
                      {currentSpeaker === 'assistant' && (
                        <div className="absolute -bottom-2 -right-2">
                          <Volume2 className="h-6 w-6 text-green-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Phone className="h-16 w-16 text-white/40" />
                  )}
                </div>
                
                <p className="text-lg font-medium text-white">
                  {callStatus === 'idle' && 'Siap untuk menelepon'}
                  {callStatus === 'connecting' && 'Menghubungkan...'}
                  {callStatus === 'active' && 'Panggilan aktif'}
                  {callStatus === 'ending' && 'Mengakhiri panggilan...'}
                </p>
                
                {callStatus === 'active' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentSpeaker === 'assistant' ? 'AI sedang berbicara...' : 'Mendengarkan...'}
                  </p>
                )}
              </div>

              {/* Volume Indicator */}
              {callStatus === 'active' && (
                <div className="mb-6">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${Math.min(volumeLevel * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Call Controls */}
              <div className="flex justify-center gap-4">
                {callStatus === 'idle' ? (
                  <Button
                    onClick={startCall}
                    size="lg"
                    className="h-14 px-8 bg-green-500 hover:bg-green-600 rounded-full"
                    disabled={!vapiPublicKey || !assistantId}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Mulai Panggilan
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={toggleMute}
                      size="lg"
                      variant="outline"
                      className={`h-14 w-14 rounded-full ${isMuted ? 'bg-red-500/20 border-red-500/50' : ''}`}
                      disabled={callStatus !== 'active'}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                      onClick={endCall}
                      size="lg"
                      className="h-14 px-8 bg-red-500 hover:bg-red-600 rounded-full"
                      disabled={callStatus === 'ending'}
                    >
                      <PhoneOff className="h-5 w-5 mr-2" />
                      Akhiri
                    </Button>
                  </>
                )}
              </div>

              {/* Config Toggle */}
              {!showConfig && callStatus === 'idle' && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowConfig(true)}
                    className="text-sm text-muted-foreground hover:text-white"
                  >
                    <Settings className="h-3 w-3 inline mr-1" />
                    Ubah Konfigurasi
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="mb-6 bg-red-500/10 border-red-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          {messages.length > 0 && (
            <Card className="mb-6 bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Transkrip Percakapan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'assistant'
                            ? 'bg-indigo-500/20 text-white'
                            : message.role === 'user'
                            ? 'bg-white/10 text-white'
                            : 'bg-yellow-500/10 text-yellow-400 text-sm italic'
                        }`}
                      >
                        {message.role !== 'system' && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {message.role === 'assistant' ? 'AI Assistant' : 'Anda'}
                          </p>
                        )}
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="mb-6 bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Cara Menggunakan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-white">1.</strong> Pastikan Anda sudah setup Vapi Assistant di dashboard.vapi.ai</p>
              <p><strong className="text-white">2.</strong> Masukkan Public Key dan Assistant ID</p>
              <p><strong className="text-white">3.</strong> Klik &quot;Mulai Panggilan&quot; dan izinkan akses mikrofon</p>
              <p><strong className="text-white">4.</strong> AI akan menyapa dan menanyakan keluhan Anda</p>
              <p><strong className="text-white">5.</strong> Sampaikan keluhan seperti: &quot;Ada jalan rusak di depan rumah saya&quot;</p>
              <p><strong className="text-white">6.</strong> AI akan memandu Anda untuk melengkapi informasi</p>
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/" className="text-muted-foreground hover:text-white text-sm">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
