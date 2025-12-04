// Nominatim (OpenStreetMap) address validation + Gemini fallback
// Free, no API key required (but respect rate limits)

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Kota Bandung bounding box (approximate)
const BANDUNG_BOUNDS = {
  south: -6.97,
  north: -6.85,
  west: 107.55,
  east: 107.70,
}

export interface AddressValidationResult {
  isValid: boolean
  isInCoverage: boolean
  formattedAddress: string | null
  lat: number | null
  lng: number | null
  rawAddress: string
  confidence: 'high' | 'medium' | 'low'
  message: string
}

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    house_number?: string
    suburb?: string
    city?: string
    city_district?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
  }
}

// Check if coordinates are within Kota Bandung
function isInBandung(lat: number, lng: number): boolean {
  return (
    lat >= BANDUNG_BOUNDS.south &&
    lat <= BANDUNG_BOUNDS.north &&
    lng >= BANDUNG_BOUNDS.west &&
    lng <= BANDUNG_BOUNDS.east
  )
}

// Check if address string mentions Bandung
function mentionsBandung(address: string): boolean {
  const lower = address.toLowerCase()
  return lower.includes('bandung') || lower.includes('bdg')
}

// Validate address using Nominatim (OpenStreetMap)
async function validateWithNominatim(address: string): Promise<AddressValidationResult | null> {
  try {
    // Add "Bandung" to search query for better results
    const searchQuery = mentionsBandung(address) ? address : `${address}, Bandung, Indonesia`
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
        q: searchQuery,
        format: 'json',
        addressdetails: '1',
        limit: '1',
        countrycodes: 'id', // Limit to Indonesia
      }),
      {
        headers: {
          'User-Agent': 'SatuPintu/1.0 (hackathon-ekraf; contact@satupintu.id)',
        },
      }
    )

    if (!response.ok) {
      console.error('Nominatim API error:', response.status)
      return null
    }

    const results: NominatimResult[] = await response.json()

    if (results.length === 0) {
      return null
    }

    const result = results[0]
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const inBandung = isInBandung(lat, lng)

    // Also check if display_name mentions Bandung
    const addressMentionsBandung = mentionsBandung(result.display_name)

    return {
      isValid: true,
      isInCoverage: inBandung || addressMentionsBandung,
      formattedAddress: result.display_name,
      lat,
      lng,
      rawAddress: address,
      confidence: 'high',
      message: inBandung || addressMentionsBandung
        ? `Alamat tervalidasi: ${result.display_name}`
        : `Alamat ditemukan tapi di luar jangkauan Kota Bandung: ${result.display_name}`,
    }
  } catch (error) {
    console.error('Nominatim validation error:', error)
    return null
  }
}

// Fallback: Use Gemini to validate address
async function validateWithGemini(address: string): Promise<AddressValidationResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `Kamu adalah validator alamat untuk Kota Bandung, Indonesia.

Alamat yang diberikan: "${address}"

Analisis alamat tersebut dan berikan respons dalam format JSON:
{
  "isValid": true/false (apakah alamat ini masuk akal dan bisa ditemukan),
  "isInBandung": true/false (apakah alamat ini kemungkinan berada di Kota Bandung),
  "formattedAddress": "alamat yang diformat lebih lengkap jika memungkinkan",
  "confidence": "high/medium/low",
  "reason": "penjelasan singkat"
}

Pertimbangkan:
- Nama jalan yang umum di Bandung (Dago, Cihampelas, Braga, Pasteur, Setiabudi, dll)
- Nama kelurahan/kecamatan di Bandung
- Landmark terkenal di Bandung

Jika alamat terlalu umum atau tidak jelas, tetap berikan estimasi terbaik.`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Extract JSON from response
    let jsonStr = response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())

    return {
      isValid: parsed.isValid ?? true,
      isInCoverage: parsed.isInBandung ?? false,
      formattedAddress: parsed.formattedAddress || address,
      lat: null, // Gemini doesn't provide coordinates
      lng: null,
      rawAddress: address,
      confidence: parsed.confidence || 'medium',
      message: parsed.reason || (parsed.isInBandung 
        ? 'Alamat kemungkinan berada di Kota Bandung' 
        : 'Alamat mungkin di luar jangkauan Kota Bandung'),
    }
  } catch (error) {
    console.error('Gemini validation error:', error)
    
    // Ultimate fallback - just accept it with low confidence
    return {
      isValid: true,
      isInCoverage: mentionsBandung(address),
      formattedAddress: address,
      lat: null,
      lng: null,
      rawAddress: address,
      confidence: 'low',
      message: 'Tidak dapat memvalidasi alamat secara otomatis. Alamat akan dicatat apa adanya.',
    }
  }
}

// Main validation function - tries Nominatim first, then Gemini
export async function validateAddress(address: string): Promise<AddressValidationResult> {
  // First, try Nominatim (free, accurate if found)
  const nominatimResult = await validateWithNominatim(address)
  
  if (nominatimResult) {
    return nominatimResult
  }

  // Fallback to Gemini
  console.log('Nominatim failed, falling back to Gemini for address validation')
  return await validateWithGemini(address)
}

// Simple validation for phone number (Indonesian format)
export function validatePhoneNumber(phone: string): {
  isValid: boolean
  formatted: string
  message: string
} {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')

  // Check if it's a valid Indonesian number
  if (cleaned.length < 9 || cleaned.length > 15) {
    return {
      isValid: false,
      formatted: phone,
      message: 'Nomor telepon tidak valid',
    }
  }

  // Format to +62
  let formatted = cleaned
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1)
  } else if (!formatted.startsWith('62')) {
    formatted = '62' + formatted
  }

  return {
    isValid: true,
    formatted: '+' + formatted,
    message: 'Nomor telepon valid',
  }
}
