'use client'

import { useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { TicketUrgency, URGENCY_LABELS, CATEGORY_LABELS, STATUS_LABELS, TicketCategory, TicketStatus } from '@/types/database'

// Dynamically import Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

export interface MapTicket {
  id: string
  lat: number
  lng: number
  category: string
  status: string
  urgency: string
  location?: string
  description?: string
  created_at?: string
}

interface HeatmapViewProps {
  tickets: MapTicket[]
  height?: string
}

// Urgency to color mapping
const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444', // red
  HIGH: '#f97316',     // orange
  MEDIUM: '#eab308',   // yellow
  LOW: '#22c55e',      // green
}

// Custom icon creator for colored markers
function createColoredIcon(color: string) {
  if (typeof window === 'undefined') return null
  
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet')
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

// Component to render markers (client-side only)
function TicketMarkers({ tickets }: { tickets: MapTicket[] }) {
  const icons = useMemo(() => {
    if (typeof window === 'undefined') return {}
    
    return {
      CRITICAL: createColoredIcon(URGENCY_COLORS.CRITICAL),
      HIGH: createColoredIcon(URGENCY_COLORS.HIGH),
      MEDIUM: createColoredIcon(URGENCY_COLORS.MEDIUM),
      LOW: createColoredIcon(URGENCY_COLORS.LOW),
    }
  }, [])

  if (typeof window === 'undefined' || Object.keys(icons).length === 0) {
    return null
  }

  return (
    <>
      {tickets.map((ticket) => {
        const icon = icons[ticket.urgency as keyof typeof icons] || icons.MEDIUM
        return (
          <Marker
            key={ticket.id}
            position={[ticket.lat, ticket.lng]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-mono text-xs text-gray-500 mb-1">{ticket.id}</div>
                <div className="font-semibold text-sm mb-2">
                  {CATEGORY_LABELS[ticket.category as TicketCategory] || ticket.category}
                </div>
                {ticket.location && (
                  <div className="text-xs text-gray-600 mb-2">{ticket.location}</div>
                )}
                {ticket.description && (
                  <div className="text-xs text-gray-700 mb-2 line-clamp-3">{ticket.description}</div>
                )}
                <div className="flex gap-2 text-xs">
                  <span 
                    className="px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: URGENCY_COLORS[ticket.urgency] || URGENCY_COLORS.MEDIUM }}
                  >
                    {URGENCY_LABELS[ticket.urgency as TicketUrgency] || ticket.urgency}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                    {STATUS_LABELS[ticket.status as TicketStatus] || ticket.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default function HeatmapView({ tickets, height = '500px' }: HeatmapViewProps) {
  // Bandung city center coordinates
  const BANDUNG_CENTER: [number, number] = [-6.9175, 107.6191]
  const DEFAULT_ZOOM = 12

  // Load Leaflet CSS
  useEffect(() => {
    // Dynamically add leaflet CSS to head
    const linkId = 'leaflet-css'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
  }, [])

  // Filter out tickets without valid coordinates
  const validTickets = useMemo(() => {
    return tickets.filter(t => 
      t.lat && t.lng && 
      !isNaN(t.lat) && !isNaN(t.lng) &&
      t.lat >= -90 && t.lat <= 90 &&
      t.lng >= -180 && t.lng <= 180
    )
  }, [tickets])

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-white/10" style={{ height }}>
      {/* Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-white/10">
        <div className="text-xs font-medium text-white mb-2">Prioritas</div>
        <div className="space-y-1.5">
          {Object.entries(URGENCY_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white/50"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-white/80">
                {URGENCY_LABELS[key as TicketUrgency]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60">
          {validTickets.length} lokasi
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={BANDUNG_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TicketMarkers tickets={validTickets} />
      </MapContainer>

      {/* Empty state */}
      {validTickets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[1001]">
          <div className="text-center text-white">
            <div className="text-lg font-medium mb-1">Tidak ada data lokasi</div>
            <div className="text-sm text-white/60">
              Belum ada laporan dengan koordinat lokasi
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
