/**
 * Address Validation dengan Google Maps Geocoding API + Landmark Database
 * 
 * Flow:
 * 1. Check landmark database (fuzzy match)
 * 2. Google Maps Geocoding dengan bounds Bandung
 * 3. AI clarification jika ambigu
 */

// ============================================================================
// LANDMARK DATABASE - Tempat terkenal di Bandung
// ============================================================================

export interface Landmark {
  name: string
  aliases: string[] // Nama alternatif / cara orang menyebut
  address: string
  lat: number
  lng: number
  category: 'perempatan' | 'mall' | 'kampus' | 'rumah_sakit' | 'kantor_pemerintah' | 'tempat_wisata' | 'terminal' | 'stasiun' | 'lainnya'
  kelurahan?: string
  kecamatan?: string
}

export const BANDUNG_LANDMARKS: Landmark[] = [
  // === PEREMPATAN UTAMA ===
  {
    name: 'Perempatan Dago - Sukajadi - Pasteur (Simpang Dago)',
    aliases: [
      'simpang dago', 'perempatan dago', 'lampu merah dago', 
      'dago sukajadi pasteur', 'perempatan pvj', 'depan pvj',
      'lampu merah sukajadi', 'perempatan sukajadi dago',
      'simpang sukajadi pasteur', 'flyover pasupati dago'
    ],
    address: 'Jl. Ir. H. Juanda (Dago), Bandung',
    lat: -6.8847,
    lng: 107.6133,
    category: 'perempatan',
    kelurahan: 'Lebakgede',
    kecamatan: 'Coblong'
  },
  {
    name: 'Perempatan Cimahi - Pasteur (Simpang Pasteur)',
    aliases: [
      'simpang pasteur', 'perempatan pasteur', 'lampu merah pasteur',
      'pasteur cimahi', 'gerbang tol pasteur', 'depan tol pasteur'
    ],
    address: 'Jl. Dr. Djunjunan (Pasteur), Bandung',
    lat: -6.8933,
    lng: 107.5950,
    category: 'perempatan',
    kelurahan: 'Pasteur',
    kecamatan: 'Sukajadi'
  },
  {
    name: 'Perempatan Cikapundung - Braga (Alun-alun)',
    aliases: [
      'alun-alun bandung', 'alun alun', 'depan alun-alun',
      'asia afrika braga', 'simpang braga', 'perempatan braga'
    ],
    address: 'Jl. Asia Afrika - Jl. Braga, Bandung',
    lat: -6.9215,
    lng: 107.6070,
    category: 'perempatan',
    kelurahan: 'Balonggede',
    kecamatan: 'Regol'
  },
  {
    name: 'Perempatan Simpang Lima',
    aliases: [
      'simpang lima bandung', 'simpang 5', 'perempatan simpang lima',
      'bundaran simpang lima', 'lampu merah simpang lima'
    ],
    address: 'Simpang Lima, Bandung',
    lat: -6.9103,
    lng: 107.6191,
    category: 'perempatan',
    kelurahan: 'Merdeka',
    kecamatan: 'Sumur Bandung'
  },
  {
    name: 'Perempatan Sulanjana - Dipatiukur',
    aliases: [
      'simpang sulanjana', 'perempatan dipatiukur', 'lampu merah dipatiukur',
      'sulanjana dipatiukur', 'depan unpad dipatiukur'
    ],
    address: 'Jl. Dipatiukur - Jl. Sulanjana, Bandung',
    lat: -6.8942,
    lng: 107.6172,
    category: 'perempatan',
    kelurahan: 'Lebakgede',
    kecamatan: 'Coblong'
  },
  {
    name: 'Perempatan Cihampelas - Cipaganti',
    aliases: [
      'simpang cihampelas', 'perempatan cihampelas', 'lampu merah cihampelas',
      'cihampelas cipaganti', 'ciwalk', 'depan ciwalk'
    ],
    address: 'Jl. Cihampelas - Jl. Cipaganti, Bandung',
    lat: -6.8936,
    lng: 107.6044,
    category: 'perempatan',
    kelurahan: 'Cipaganti',
    kecamatan: 'Coblong'
  },
  {
    name: 'Perempatan Buah Batu - Soekarno Hatta',
    aliases: [
      'simpang buah batu', 'perempatan buah batu', 'buahbatu soekarno hatta',
      'lampu merah buahbatu', 'metro buah batu', 'depan metro'
    ],
    address: 'Jl. Buah Batu - Jl. Soekarno Hatta, Bandung',
    lat: -6.9408,
    lng: 107.6339,
    category: 'perempatan',
    kelurahan: 'Batununggal',
    kecamatan: 'Bandung Kidul'
  },
  {
    name: 'Perempatan Gatot Subroto - Soekarno Hatta',
    aliases: [
      'simpang gatsu', 'perempatan gatot subroto', 'gatsu soekarno hatta',
      'lampu merah gatsu', 'carrefour gatsu'
    ],
    address: 'Jl. Gatot Subroto - Jl. Soekarno Hatta, Bandung',
    lat: -6.9267,
    lng: 107.6417,
    category: 'perempatan',
    kelurahan: 'Maleer',
    kecamatan: 'Batununggal'
  },
  {
    name: 'Perempatan Laswi - Soekarno Hatta',
    aliases: [
      'simpang laswi', 'perempatan laswi', 'laswi soekarno hatta',
      'lampu merah laswi'
    ],
    address: 'Jl. Laswi - Jl. Soekarno Hatta, Bandung',
    lat: -6.9342,
    lng: 107.6278,
    category: 'perempatan',
    kelurahan: 'Kebonwaru',
    kecamatan: 'Batununggal'
  },

  // === MALL / PUSAT PERBELANJAAN ===
  {
    name: 'Paris Van Java (PVJ)',
    aliases: [
      'pvj', 'paris van java', 'mall pvj', 'pvj mall',
      'paris van java mall', 'pvj sukajadi'
    ],
    address: 'Jl. Sukajadi No.137-139, Bandung',
    lat: -6.8867,
    lng: 107.5983,
    category: 'mall',
    kelurahan: 'Cipedes',
    kecamatan: 'Sukajadi'
  },
  {
    name: 'Cihampelas Walk (Ciwalk)',
    aliases: [
      'ciwalk', 'cihampelas walk', 'mall ciwalk', 'ciwalk mall'
    ],
    address: 'Jl. Cihampelas No.160, Bandung',
    lat: -6.8937,
    lng: 107.6031,
    category: 'mall',
    kelurahan: 'Cipaganti',
    kecamatan: 'Coblong'
  },
  {
    name: 'Bandung Indah Plaza (BIP)',
    aliases: [
      'bip', 'bandung indah plaza', 'mall bip', 'bip mall',
      'bip merdeka'
    ],
    address: 'Jl. Merdeka No.56, Bandung',
    lat: -6.9098,
    lng: 107.6118,
    category: 'mall',
    kelurahan: 'Citarum',
    kecamatan: 'Bandung Wetan'
  },
  {
    name: 'Trans Studio Mall (TSM)',
    aliases: [
      'tsm', 'trans studio mall', 'trans studio', 'mall tsm',
      'tsm bandung', 'trans studio bandung'
    ],
    address: 'Jl. Gatot Subroto No.289, Bandung',
    lat: -6.9260,
    lng: 107.6360,
    category: 'mall',
    kelurahan: 'Cibangkong',
    kecamatan: 'Batununggal'
  },
  {
    name: '23 Paskal Shopping Center',
    aliases: [
      '23 paskal', 'paskal', 'mall paskal', 'paskal hypersquare',
      'paskal 23', 'hyper square'
    ],
    address: 'Jl. Pasir Kaliki No.25-27, Bandung',
    lat: -6.9108,
    lng: 107.5978,
    category: 'mall',
    kelurahan: 'Kebon Jeruk',
    kecamatan: 'Andir'
  },
  {
    name: 'Istana Plaza (IP)',
    aliases: [
      'ip', 'istana plaza', 'mall ip', 'ip mall',
      'istana plaza bandung', 'ip pasirkaliki'
    ],
    address: 'Jl. Pasir Kaliki No.121-123, Bandung',
    lat: -6.9053,
    lng: 107.5958,
    category: 'mall',
    kelurahan: 'Kebon Jeruk',
    kecamatan: 'Andir'
  },
  {
    name: 'Bandung Electronic Center (BEC)',
    aliases: [
      'bec', 'bandung electronic center', 'bec mall',
      'bec purnawarman', 'mall bec'
    ],
    address: 'Jl. Purnawarman No.13-15, Bandung',
    lat: -6.9128,
    lng: 107.6090,
    category: 'mall',
    kelurahan: 'Tamansari',
    kecamatan: 'Bandung Wetan'
  },
  {
    name: 'Festival Citylink',
    aliases: [
      'citylink', 'festival citylink', 'mall citylink',
      'citylink peta', 'festival link'
    ],
    address: 'Jl. Peta No.241, Bandung',
    lat: -6.9217,
    lng: 107.5858,
    category: 'mall',
    kelurahan: 'Suka Asih',
    kecamatan: 'Bojongloa Kaler'
  },

  // === KAMPUS / UNIVERSITAS ===
  {
    name: 'Institut Teknologi Bandung (ITB)',
    aliases: [
      'itb', 'institut teknologi bandung', 'kampus itb',
      'itb ganesha', 'kampus ganesha'
    ],
    address: 'Jl. Ganesha No.10, Bandung',
    lat: -6.8915,
    lng: 107.6107,
    category: 'kampus',
    kelurahan: 'Lebakgede',
    kecamatan: 'Coblong'
  },
  {
    name: 'Universitas Padjadjaran (Unpad) Dipatiukur',
    aliases: [
      'unpad', 'universitas padjadjaran', 'kampus unpad',
      'unpad dipatiukur', 'fikom unpad', 'fisip unpad'
    ],
    address: 'Jl. Dipatiukur No.35, Bandung',
    lat: -6.8964,
    lng: 107.6165,
    category: 'kampus',
    kelurahan: 'Lebakgede',
    kecamatan: 'Coblong'
  },
  {
    name: 'Universitas Katolik Parahyangan (Unpar)',
    aliases: [
      'unpar', 'parahyangan', 'universitas parahyangan',
      'kampus unpar', 'unpar ciumbuleuit'
    ],
    address: 'Jl. Ciumbuleuit No.94, Bandung',
    lat: -6.8755,
    lng: 107.6056,
    category: 'kampus',
    kelurahan: 'Hegarmanah',
    kecamatan: 'Cidadap'
  },
  {
    name: 'Universitas Pendidikan Indonesia (UPI)',
    aliases: [
      'upi', 'universitas pendidikan indonesia', 'kampus upi',
      'upi setiabudi', 'upi isola'
    ],
    address: 'Jl. Dr. Setiabudi No.229, Bandung',
    lat: -6.8614,
    lng: 107.5933,
    category: 'kampus',
    kelurahan: 'Isola',
    kecamatan: 'Sukasari'
  },
  {
    name: 'Telkom University',
    aliases: [
      'telkom university', 'tel-u', 'telu', 'kampus telkom',
      'telkom buahbatu', 'dayeuhkolot'
    ],
    address: 'Jl. Telekomunikasi No.1, Bandung',
    lat: -6.9730,
    lng: 107.6308,
    category: 'kampus',
    kelurahan: 'Sukapura',
    kecamatan: 'Dayeuhkolot'
  },
  {
    name: 'Universitas Islam Bandung (Unisba)',
    aliases: [
      'unisba', 'universitas islam bandung', 'kampus unisba',
      'unisba tamansari'
    ],
    address: 'Jl. Tamansari No.1, Bandung',
    lat: -6.9123,
    lng: 107.6183,
    category: 'kampus',
    kelurahan: 'Tamansari',
    kecamatan: 'Bandung Wetan'
  },

  // === RUMAH SAKIT ===
  {
    name: 'RS Hasan Sadikin (RSHS)',
    aliases: [
      'rshs', 'hasan sadikin', 'rs hasan sadikin',
      'rumah sakit hasan sadikin', 'rshs bandung'
    ],
    address: 'Jl. Pasteur No.38, Bandung',
    lat: -6.8939,
    lng: 107.5994,
    category: 'rumah_sakit',
    kelurahan: 'Pasteur',
    kecamatan: 'Sukajadi'
  },
  {
    name: 'RS Borromeus',
    aliases: [
      'borromeus', 'rs borromeus', 'rumah sakit borromeus',
      'santo borromeus', 'rs santo borromeus'
    ],
    address: 'Jl. Ir. H. Juanda No.100, Bandung',
    lat: -6.8878,
    lng: 107.6153,
    category: 'rumah_sakit',
    kelurahan: 'Lebakgede',
    kecamatan: 'Coblong'
  },
  {
    name: 'RS Advent Bandung',
    aliases: [
      'rs advent', 'rumah sakit advent', 'advent bandung',
      'rs advent cihampelas'
    ],
    address: 'Jl. Cihampelas No.161, Bandung',
    lat: -6.8929,
    lng: 107.6028,
    category: 'rumah_sakit',
    kelurahan: 'Cipaganti',
    kecamatan: 'Coblong'
  },
  {
    name: 'RS Santo Yusuf',
    aliases: [
      'rs santo yusuf', 'santo yusuf', 'rumah sakit santo yusuf',
      'rs yusuf'
    ],
    address: 'Jl. Cikutra No.7, Bandung',
    lat: -6.9083,
    lng: 107.6344,
    category: 'rumah_sakit',
    kelurahan: 'Cikutra',
    kecamatan: 'Cibeunying Kidul'
  },

  // === KANTOR PEMERINTAH ===
  {
    name: 'Gedung Sate (Pemprov Jabar)',
    aliases: [
      'gedung sate', 'pemprov jabar', 'kantor gubernur',
      'gubernuran', 'gedung sate bandung'
    ],
    address: 'Jl. Diponegoro No.22, Bandung',
    lat: -6.9025,
    lng: 107.6186,
    category: 'kantor_pemerintah',
    kelurahan: 'Citarum',
    kecamatan: 'Bandung Wetan'
  },
  {
    name: 'Balai Kota Bandung',
    aliases: [
      'balai kota', 'pemkot bandung', 'kantor walikota',
      'balaikota bandung', 'walikota bandung'
    ],
    address: 'Jl. Wastukencana No.2, Bandung',
    lat: -6.9108,
    lng: 107.6167,
    category: 'kantor_pemerintah',
    kelurahan: 'Babakan Ciamis',
    kecamatan: 'Sumur Bandung'
  },
  {
    name: 'Kantor Polrestabes Bandung',
    aliases: [
      'polrestabes', 'polrestabes bandung', 'kantor polisi',
      'polres bandung', 'polrestabes merdeka'
    ],
    address: 'Jl. Merdeka No.18, Bandung',
    lat: -6.9096,
    lng: 107.6104,
    category: 'kantor_pemerintah',
    kelurahan: 'Citarum',
    kecamatan: 'Bandung Wetan'
  },

  // === TEMPAT WISATA ===
  {
    name: 'Kebun Binatang Bandung',
    aliases: [
      'kebun binatang', 'bonbin', 'bandung zoo',
      'kebun binatang tamansari', 'bonbin bandung'
    ],
    address: 'Jl. Tamansari No.6, Bandung',
    lat: -6.9003,
    lng: 107.6087,
    category: 'tempat_wisata',
    kelurahan: 'Lebakgede',
    kecamatan: 'Coblong'
  },
  {
    name: 'Museum Geologi',
    aliases: [
      'museum geologi', 'museum geologi bandung',
      'museum diponegoro'
    ],
    address: 'Jl. Diponegoro No.57, Bandung',
    lat: -6.8997,
    lng: 107.6140,
    category: 'tempat_wisata',
    kelurahan: 'Citarum',
    kecamatan: 'Bandung Wetan'
  },
  {
    name: 'Museum Konferensi Asia Afrika',
    aliases: [
      'museum asia afrika', 'museum kaa', 'gedung merdeka',
      'konferensi asia afrika', 'museum asia afrika bandung'
    ],
    address: 'Jl. Asia Afrika No.65, Bandung',
    lat: -6.9218,
    lng: 107.6090,
    category: 'tempat_wisata',
    kelurahan: 'Braga',
    kecamatan: 'Sumur Bandung'
  },
  {
    name: 'Saung Angklung Udjo',
    aliases: [
      'saung angklung', 'sau', 'saung udjo',
      'saung angklung udjo', 'angklung udjo'
    ],
    address: 'Jl. Padasuka No.118, Bandung',
    lat: -6.8939,
    lng: 107.6594,
    category: 'tempat_wisata',
    kelurahan: 'Pasirlayung',
    kecamatan: 'Cibeunying Kidul'
  },

  // === TERMINAL / STASIUN ===
  {
    name: 'Stasiun Bandung (Hall)',
    aliases: [
      'stasiun bandung', 'stasiun hall', 'stasiun kereta bandung',
      'hall bandung', 'stasiun kereta api bandung'
    ],
    address: 'Jl. Stasiun Timur No.1, Bandung',
    lat: -6.9126,
    lng: 107.6019,
    category: 'stasiun',
    kelurahan: 'Kebon Jeruk',
    kecamatan: 'Andir'
  },
  {
    name: 'Stasiun Kiaracondong',
    aliases: [
      'kiaracondong', 'stasiun kiaracondong', 'kc',
      'stasiun kiara condong'
    ],
    address: 'Jl. Kiaracondong, Bandung',
    lat: -6.9311,
    lng: 107.6456,
    category: 'stasiun',
    kelurahan: 'Kebon Kangkung',
    kecamatan: 'Kiaracondong'
  },
  {
    name: 'Terminal Cicaheum',
    aliases: [
      'cicaheum', 'terminal cicaheum', 'terminal bis cicaheum',
      'terminal cicaheum bandung'
    ],
    address: 'Jl. Jenderal A. Yani, Bandung',
    lat: -6.9042,
    lng: 107.6631,
    category: 'terminal',
    kelurahan: 'Cicaheum',
    kecamatan: 'Kiaracondong'
  },
  {
    name: 'Terminal Leuwipanjang',
    aliases: [
      'leuwipanjang', 'terminal leuwipanjang', 'terminal bis leuwipanjang',
      'terminal leuwi panjang'
    ],
    address: 'Jl. Soekarno-Hatta, Bandung',
    lat: -6.9419,
    lng: 107.5897,
    category: 'terminal',
    kelurahan: 'Kopo',
    kecamatan: 'Bojongloa Kaler'
  },

  // === LAINNYA ===
  {
    name: 'Lapangan Gasibu',
    aliases: [
      'gasibu', 'lapangan gasibu', 'car free day gasibu',
      'cfd gasibu', 'gasibu bandung'
    ],
    address: 'Jl. Diponegoro, Bandung',
    lat: -6.8996,
    lng: 107.6168,
    category: 'lainnya',
    kelurahan: 'Citarum',
    kecamatan: 'Bandung Wetan'
  },
  {
    name: 'Taman Film Bandung',
    aliases: [
      'taman film', 'taman film bandung', 
      'taman film dago'
    ],
    address: 'Jl. Layang Pasupati, Bandung',
    lat: -6.8919,
    lng: 107.6089,
    category: 'lainnya',
    kelurahan: 'Tamansari',
    kecamatan: 'Bandung Wetan'
  },
  {
    name: 'Masjid Raya Bandung',
    aliases: [
      'masjid raya', 'masjid raya bandung', 'masjid agung bandung',
      'mesjid raya', 'alun-alun masjid raya'
    ],
    address: 'Jl. Dalem Kaum No.14, Bandung',
    lat: -6.9210,
    lng: 107.6056,
    category: 'lainnya',
    kelurahan: 'Balonggede',
    kecamatan: 'Regol'
  },
  {
    name: 'Jalan Braga',
    aliases: [
      'braga', 'jalan braga', 'jl braga',
      'braga bandung', 'braga culinary night'
    ],
    address: 'Jl. Braga, Bandung',
    lat: -6.9178,
    lng: 107.6091,
    category: 'lainnya',
    kelurahan: 'Braga',
    kecamatan: 'Sumur Bandung'
  },
  {
    name: 'Jalan Dago (Ir. H. Juanda)',
    aliases: [
      'dago', 'jalan dago', 'jl dago',
      'dago atas', 'dago bawah', 'jl juanda'
    ],
    address: 'Jl. Ir. H. Juanda, Bandung',
    lat: -6.8847,
    lng: 107.6147,
    category: 'lainnya',
    kelurahan: 'Lebakgede',
    kecamatan: 'Coblong'
  },
]

// ============================================================================
// GOOGLE MAPS GEOCODING
// ============================================================================

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || ''

// Bandung bounding box untuk biasing hasil
const BANDUNG_BOUNDS = {
  south: -6.98,
  north: -6.84,
  west: 107.54,
  east: 107.72,
}

// Center of Bandung
const BANDUNG_CENTER = {
  lat: -6.9175,
  lng: 107.6191,
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
  source: 'landmark' | 'google_maps' | 'fallback'
  landmark?: Landmark
  needsClarification?: boolean
  clarificationQuestion?: string
  suggestions?: string[]
}

interface GoogleGeocodingResult {
  results: Array<{
    formatted_address: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
      location_type: string
    }
    address_components: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
    partial_match?: boolean
  }>
  status: string
  error_message?: string
}

// ============================================================================
// FUZZY MATCHING UNTUK LANDMARK
// ============================================================================

/**
 * Simple fuzzy match score (0-1)
 * Higher = better match
 */
function fuzzyMatch(input: string, target: string): number {
  const inputLower = input.toLowerCase().trim()
  const targetLower = target.toLowerCase().trim()
  
  // Exact match
  if (inputLower === targetLower) return 1.0
  
  // Contains match
  if (targetLower.includes(inputLower) || inputLower.includes(targetLower)) {
    return 0.8
  }
  
  // Word overlap
  const inputWords = inputLower.split(/\s+/)
  const targetWords = targetLower.split(/\s+/)
  
  let matchedWords = 0
  for (const word of inputWords) {
    if (word.length < 3) continue // Skip short words
    if (targetWords.some(tw => tw.includes(word) || word.includes(tw))) {
      matchedWords++
    }
  }
  
  if (inputWords.length > 0) {
    return (matchedWords / inputWords.length) * 0.7
  }
  
  return 0
}

/**
 * Find best matching landmark
 */
function findLandmark(query: string): { landmark: Landmark; score: number } | null {
  let bestMatch: { landmark: Landmark; score: number } | null = null
  
  for (const landmark of BANDUNG_LANDMARKS) {
    // Check name
    let score = fuzzyMatch(query, landmark.name)
    
    // Check aliases
    for (const alias of landmark.aliases) {
      const aliasScore = fuzzyMatch(query, alias)
      if (aliasScore > score) {
        score = aliasScore
      }
    }
    
    // Minimum threshold
    if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { landmark, score }
    }
  }
  
  return bestMatch
}

// ============================================================================
// CHECK IF COORDINATES IN BANDUNG
// ============================================================================

function isInBandung(lat: number, lng: number): boolean {
  return (
    lat >= BANDUNG_BOUNDS.south &&
    lat <= BANDUNG_BOUNDS.north &&
    lng >= BANDUNG_BOUNDS.west &&
    lng <= BANDUNG_BOUNDS.east
  )
}

// ============================================================================
// GOOGLE MAPS GEOCODING
// ============================================================================

async function geocodeWithGoogle(address: string): Promise<AddressValidationResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('GOOGLE_MAPS_API_KEY not configured')
    return null
  }
  
  try {
    // Add Bandung context if not present
    let searchQuery = address
    if (!address.toLowerCase().includes('bandung')) {
      searchQuery = `${address}, Bandung, Indonesia`
    }
    
    const params = new URLSearchParams({
      address: searchQuery,
      key: GOOGLE_MAPS_API_KEY,
      region: 'id',
      language: 'id',
      // Bias results to Bandung area
      bounds: `${BANDUNG_BOUNDS.south},${BANDUNG_BOUNDS.west}|${BANDUNG_BOUNDS.north},${BANDUNG_BOUNDS.east}`,
    })
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`
    )
    
    if (!response.ok) {
      console.error('Google Maps API error:', response.status)
      return null
    }
    
    const data: GoogleGeocodingResult = await response.json()
    
    // Check for API errors (not enabled, quota exceeded, etc.)
    if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API error:', data.status, data.error_message)
      return null
    }
    
    if (data.status !== 'OK' || data.results.length === 0) {
      console.log('Google Maps: No results for', address, 'Status:', data.status)
      return null
    }
    
    const result = data.results[0]
    const { lat, lng } = result.geometry.location
    const inBandung = isInBandung(lat, lng)
    
    // Check if address mentions Bandung
    const addressInBandung = result.formatted_address.toLowerCase().includes('bandung')
    
    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'high'
    if (result.partial_match) {
      confidence = 'medium'
    }
    if (result.geometry.location_type === 'APPROXIMATE') {
      confidence = 'low'
    }
    
    return {
      isValid: true,
      isInCoverage: inBandung || addressInBandung,
      formattedAddress: result.formatted_address,
      lat,
      lng,
      rawAddress: address,
      confidence,
      message: inBandung || addressInBandung
        ? `Alamat ditemukan: ${result.formatted_address}`
        : `Alamat ditemukan tapi di luar jangkauan Kota Bandung: ${result.formatted_address}`,
      source: 'google_maps',
    }
  } catch (error) {
    console.error('Google Maps geocoding error:', error)
    return null
  }
}

// ============================================================================
// NOMINATIM (OSM) FALLBACK
// ============================================================================

async function geocodeWithNominatim(address: string): Promise<AddressValidationResult | null> {
  try {
    // Add Bandung context if not present
    let searchQuery = address
    if (!address.toLowerCase().includes('bandung')) {
      searchQuery = `${address}, Bandung, Indonesia`
    }
    
    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      limit: '1',
      countrycodes: 'id',
    })
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'SatuPintu/1.0 (hackathon-ekraf)',
        },
      }
    )
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.status)
      return null
    }
    
    const results = await response.json()
    
    if (!results || results.length === 0) {
      // Try simpler query (without "Jalan" prefix and number)
      const simplifiedQuery = address
        .replace(/^jl\.?\s*/i, '')
        .replace(/^jalan\s*/i, '')
        .replace(/no\.?\s*\d+/i, '')
        .trim()
      
      if (simplifiedQuery !== address) {
        console.log('Nominatim: Trying simplified query:', simplifiedQuery)
        const simpleParams = new URLSearchParams({
          q: `${simplifiedQuery} Bandung`,
          format: 'json',
          addressdetails: '1',
          limit: '1',
        })
        
        const simpleResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?${simpleParams}`,
          {
            headers: {
              'User-Agent': 'SatuPintu/1.0 (hackathon-ekraf)',
            },
          }
        )
        
        if (simpleResponse.ok) {
          const simpleResults = await simpleResponse.json()
          if (simpleResults && simpleResults.length > 0) {
            const result = simpleResults[0]
            const lat = parseFloat(result.lat)
            const lng = parseFloat(result.lon)
            const inBandung = isInBandung(lat, lng)
            const addressInBandung = result.display_name.toLowerCase().includes('bandung')
            
            return {
              isValid: true,
              isInCoverage: inBandung || addressInBandung,
              formattedAddress: result.display_name,
              lat,
              lng,
              rawAddress: address,
              confidence: 'medium',
              message: inBandung || addressInBandung
                ? `Alamat ditemukan (area): ${result.display_name}`
                : `Alamat ditemukan tapi di luar jangkauan Kota Bandung`,
              source: 'google_maps',
            }
          }
        }
      }
      
      console.log('Nominatim: No results for', address)
      return null
    }
    
    const result = results[0]
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const inBandung = isInBandung(lat, lng)
    
    // Check if display_name mentions Bandung
    const addressInBandung = result.display_name.toLowerCase().includes('bandung')
    
    return {
      isValid: true,
      isInCoverage: inBandung || addressInBandung,
      formattedAddress: result.display_name,
      lat,
      lng,
      rawAddress: address,
      confidence: 'medium', // Nominatim is generally less accurate
      message: inBandung || addressInBandung
        ? `Alamat ditemukan: ${result.display_name}`
        : `Alamat ditemukan tapi di luar jangkauan Kota Bandung: ${result.display_name}`,
      source: 'google_maps', // Keep as google_maps for compatibility
    }
  } catch (error) {
    console.error('Nominatim geocoding error:', error)
    return null
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate address dengan flow:
 * 1. Check landmark database (fuzzy match)
 * 2. Google Maps Geocoding
 * 3. Nominatim (OSM) fallback
 * 4. Generate clarification jika ambigu
 */
export async function validateAddressEnhanced(address: string): Promise<AddressValidationResult> {
  const trimmedAddress = address.trim()
  
  // === STEP 1: Check Landmark Database ===
  const landmarkMatch = findLandmark(trimmedAddress)
  
  if (landmarkMatch && landmarkMatch.score >= 0.7) {
    const { landmark } = landmarkMatch
    return {
      isValid: true,
      isInCoverage: true,
      formattedAddress: landmark.address,
      lat: landmark.lat,
      lng: landmark.lng,
      rawAddress: trimmedAddress,
      confidence: landmarkMatch.score >= 0.9 ? 'high' : 'medium',
      message: `Lokasi dikenali: ${landmark.name}. Alamat: ${landmark.address}`,
      source: 'landmark',
      landmark,
    }
  }
  
  // === STEP 2: Google Maps Geocoding ===
  const googleResult = await geocodeWithGoogle(trimmedAddress)
  
  if (googleResult) {
    // If Google found something but confidence is low, suggest clarification
    if (googleResult.confidence === 'low' || !googleResult.isInCoverage) {
      // Find nearby landmarks for suggestion
      const suggestions = findNearbyLandmarkSuggestions(trimmedAddress)
      
      if (suggestions.length > 0) {
        return {
          ...googleResult,
          needsClarification: true,
          clarificationQuestion: `Untuk memastikan lokasi yang tepat, apakah lokasi tersebut dekat dengan ${suggestions[0]}?`,
          suggestions,
        }
      }
    }
    
    return googleResult
  }
  
  // === STEP 3: Nominatim (OSM) Fallback ===
  console.log('Google Maps failed, trying Nominatim fallback...')
  const nominatimResult = await geocodeWithNominatim(trimmedAddress)
  
  if (nominatimResult) {
    // If Nominatim found something but confidence is low, suggest clarification
    if (nominatimResult.confidence === 'low' || !nominatimResult.isInCoverage) {
      const suggestions = findNearbyLandmarkSuggestions(trimmedAddress)
      
      if (suggestions.length > 0) {
        return {
          ...nominatimResult,
          needsClarification: true,
          clarificationQuestion: `Untuk memastikan lokasi yang tepat, apakah lokasi tersebut dekat dengan ${suggestions[0]}?`,
          suggestions,
        }
      }
    }
    
    return nominatimResult
  }
  
  // === STEP 4: Fallback - Generate clarification question ===
  const suggestions = findNearbyLandmarkSuggestions(trimmedAddress)
  
  return {
    isValid: false,
    isInCoverage: false,
    formattedAddress: null,
    lat: null,
    lng: null,
    rawAddress: trimmedAddress,
    confidence: 'low',
    message: 'Alamat tidak dapat ditemukan. Mohon berikan detail yang lebih spesifik.',
    source: 'fallback',
    needsClarification: true,
    clarificationQuestion: suggestions.length > 0
      ? `Maaf, saya belum dapat menemukan lokasi tersebut. Apakah lokasinya dekat dengan ${suggestions[0]}? Atau bisa sebutkan nama jalan dan kelurahan/kecamatannya?`
      : 'Maaf, saya belum dapat menemukan lokasi tersebut. Bisa tolong sebutkan nama jalan lengkap, kelurahan, dan kecamatannya?',
    suggestions,
  }
}

/**
 * Find landmark suggestions based on keywords in the address
 */
function findNearbyLandmarkSuggestions(address: string): string[] {
  const addressLower = address.toLowerCase()
  const suggestions: string[] = []
  
  // Keywords mapping to relevant landmarks
  const keywordMap: Record<string, string[]> = {
    'sukajadi': ['PVJ (Paris Van Java)', 'RS Hasan Sadikin'],
    'dago': ['ITB', 'Simpang Dago', 'RS Borromeus'],
    'pasteur': ['RS Hasan Sadikin', 'Simpang Pasteur'],
    'cihampelas': ['Cihampelas Walk (Ciwalk)', 'RS Advent'],
    'dipatiukur': ['Unpad Dipatiukur', 'Perempatan Sulanjana'],
    'braga': ['Alun-alun Bandung', 'Jalan Braga'],
    'asia afrika': ['Alun-alun Bandung', 'Museum Konferensi Asia Afrika'],
    'buah batu': ['Metro Buah Batu', 'Telkom University'],
    'gatot subroto': ['Trans Studio Mall', 'Carrefour Gatsu'],
    'soekarno hatta': ['Terminal Leuwipanjang', 'Metro Buah Batu'],
    'setiabudi': ['UPI'],
    'ciumbuleuit': ['Unpar'],
    'tamansari': ['Kebun Binatang', 'Unisba'],
    'merdeka': ['BIP', 'Polrestabes'],
    'diponegoro': ['Gedung Sate', 'Gasibu', 'Museum Geologi'],
    'pvj': ['PVJ (Paris Van Java)'],
    'lampu merah': ['Simpang Dago', 'Simpang Pasteur', 'Simpang Buah Batu'],
    'perempatan': ['Simpang Dago', 'Simpang Pasteur', 'Simpang Lima'],
    'pasir kaliki': ['23 Paskal', 'Istana Plaza (IP)', 'Stasiun Bandung'],
    'paskal': ['23 Paskal', 'Istana Plaza (IP)'],
    'andir': ['23 Paskal', 'Stasiun Bandung'],
    'kebon jeruk': ['Stasiun Bandung', '23 Paskal'],
    'cicendo': ['RS Cicendo', 'Stasiun Bandung'],
  }
  
  for (const [keyword, landmarks] of Object.entries(keywordMap)) {
    if (addressLower.includes(keyword)) {
      for (const landmark of landmarks) {
        if (!suggestions.includes(landmark)) {
          suggestions.push(landmark)
        }
      }
    }
  }
  
  // If no suggestions found, return some central landmarks
  if (suggestions.length === 0) {
    return ['Alun-alun Bandung', 'Gedung Sate', 'BIP (Bandung Indah Plaza)']
  }
  
  return suggestions.slice(0, 3)
}

/**
 * Get all landmarks for a specific category
 */
export function getLandmarksByCategory(category: Landmark['category']): Landmark[] {
  return BANDUNG_LANDMARKS.filter(l => l.category === category)
}

/**
 * Search landmarks by query
 */
export function searchLandmarks(query: string): Landmark[] {
  const results: Array<{ landmark: Landmark; score: number }> = []
  
  for (const landmark of BANDUNG_LANDMARKS) {
    let score = fuzzyMatch(query, landmark.name)
    for (const alias of landmark.aliases) {
      const aliasScore = fuzzyMatch(query, alias)
      if (aliasScore > score) score = aliasScore
    }
    
    if (score >= 0.3) {
      results.push({ landmark, score })
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(r => r.landmark)
}
