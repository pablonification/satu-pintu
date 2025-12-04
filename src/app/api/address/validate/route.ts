import { NextRequest, NextResponse } from 'next/server'
import { validateAddress } from '@/lib/nominatim'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      )
    }

    const result = await validateAddress(address)

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
