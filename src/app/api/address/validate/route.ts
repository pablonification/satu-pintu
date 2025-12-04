import { NextRequest, NextResponse } from 'next/server'
import { validateAddressEnhanced, searchLandmarks } from '@/lib/address-validation'

export async function POST(request: NextRequest) {
  try {
    const { address, action } = await request.json()

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      )
    }

    // Optional: search landmarks only
    if (action === 'search_landmarks') {
      const landmarks = searchLandmarks(address)
      return NextResponse.json({
        success: true,
        data: {
          landmarks: landmarks.map(l => ({
            name: l.name,
            address: l.address,
            category: l.category,
            lat: l.lat,
            lng: l.lng,
          }))
        },
      })
    }

    // Full address validation
    const result = await validateAddressEnhanced(address)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Address validation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate address' },
      { status: 500 }
    )
  }
}
