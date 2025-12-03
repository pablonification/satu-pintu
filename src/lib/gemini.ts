import { GoogleGenerativeAI } from '@google/generative-ai'
import { TicketCategory, TicketUrgency, CATEGORY_TO_DINAS, DinasId } from '@/types/database'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export interface AnalyzedComplaint {
  category: TicketCategory
  subcategory: string
  location: string
  description: string
  urgency: TicketUrgency
  assignedDinas: DinasId[]
  summary: string // For TTS response
}

const SYSTEM_PROMPT = `Kamu adalah AI asisten untuk menganalisis keluhan warga kota Bandung.
Tugasmu adalah mengekstrak informasi dari keluhan yang disampaikan warga.

KATEGORI yang tersedia:
- DARURAT: kecelakaan, kebakaran, kejahatan, keadaan darurat medis, bencana
- INFRA: jalan rusak, lampu mati, jembatan rusak, drainase tersumbat
- KEBERSIHAN: sampah menumpuk, got kotor, limbah, polusi
- SOSIAL: ODGJ, gelandangan, anak terlantar, lansia butuh bantuan
- LAINNYA: keluhan lain yang tidak masuk kategori di atas

LEVEL URGENCY:
- CRITICAL: nyawa dalam bahaya, butuh respon < 15 menit (kecelakaan dengan korban, kebakaran aktif, kejahatan berlangsung)
- HIGH: mendesak, butuh respon < 1 jam (jalan rusak berbahaya, ODGJ agresif)
- MEDIUM: butuh respon < 24 jam (sampah menumpuk, lampu mati)
- LOW: bisa ditangani dalam 72 jam (keluhan umum)

Selalu ekstrak LOKASI sejelas mungkin. Jika tidak disebutkan, minta klarifikasi dalam summary.

PENTING: Responmu HARUS dalam format JSON valid dengan struktur:
{
  "category": "DARURAT|INFRA|KEBERSIHAN|SOSIAL|LAINNYA",
  "subcategory": "jenis spesifik keluhan",
  "location": "lokasi lengkap",
  "description": "deskripsi detail keluhan",
  "urgency": "CRITICAL|HIGH|MEDIUM|LOW",
  "summary": "ringkasan singkat dalam Bahasa Indonesia untuk dibacakan ke warga (1-2 kalimat konfirmasi)"
}`

export async function analyzeComplaint(transcription: string): Promise<AnalyzedComplaint> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `${SYSTEM_PROMPT}

Keluhan warga:
"${transcription}"

Analisis dan berikan respons dalam format JSON:`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = response
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  try {
    const parsed = JSON.parse(jsonStr.trim())
    
    // Validate and set defaults
    const category: TicketCategory = ['DARURAT', 'INFRA', 'KEBERSIHAN', 'SOSIAL', 'LAINNYA'].includes(parsed.category) 
      ? parsed.category 
      : 'LAINNYA'
    
    const urgency: TicketUrgency = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.urgency)
      ? parsed.urgency
      : 'MEDIUM'

    return {
      category,
      subcategory: parsed.subcategory || 'Umum',
      location: parsed.location || 'Lokasi tidak disebutkan',
      description: parsed.description || transcription,
      urgency,
      assignedDinas: CATEGORY_TO_DINAS[category],
      summary: parsed.summary || `Keluhan tentang ${parsed.subcategory || 'masalah umum'} telah dicatat.`,
    }
  } catch {
    // Fallback if JSON parsing fails
    return {
      category: 'LAINNYA',
      subcategory: 'Umum',
      location: 'Lokasi tidak disebutkan',
      description: transcription,
      urgency: 'MEDIUM',
      assignedDinas: ['admin'],
      summary: 'Keluhan Anda telah dicatat dan akan diteruskan ke petugas terkait.',
    }
  }
}

// Process audio directly with Gemini 2.0 Flash (native audio support)
export async function processAudioWithGemini(audioBase64: string, mimeType: string): Promise<AnalyzedComplaint> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `${SYSTEM_PROMPT}

Dengarkan audio keluhan dari warga dan berikan analisis dalam format JSON:`

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    },
  ])

  const response = result.response.text()

  // Extract JSON from response
  let jsonStr = response
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  try {
    const parsed = JSON.parse(jsonStr.trim())
    
    const category: TicketCategory = ['DARURAT', 'INFRA', 'KEBERSIHAN', 'SOSIAL', 'LAINNYA'].includes(parsed.category) 
      ? parsed.category 
      : 'LAINNYA'
    
    const urgency: TicketUrgency = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.urgency)
      ? parsed.urgency
      : 'MEDIUM'

    return {
      category,
      subcategory: parsed.subcategory || 'Umum',
      location: parsed.location || 'Lokasi tidak disebutkan',
      description: parsed.description || 'Deskripsi dari audio',
      urgency,
      assignedDinas: CATEGORY_TO_DINAS[category],
      summary: parsed.summary || 'Keluhan Anda telah dicatat.',
    }
  } catch {
    return {
      category: 'LAINNYA',
      subcategory: 'Umum',
      location: 'Lokasi tidak disebutkan',
      description: 'Audio tidak dapat diproses dengan baik',
      urgency: 'MEDIUM',
      assignedDinas: ['admin'],
      summary: 'Maaf, kami kesulitan memahami keluhan Anda. Akan diteruskan ke petugas.',
    }
  }
}
