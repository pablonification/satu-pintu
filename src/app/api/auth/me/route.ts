import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JWTPayload {
  dinas_id: string
  dinas_name: string
  categories: string[]
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    return NextResponse.json({
      success: true,
      data: {
        dinasId: decoded.dinas_id,
        dinasName: decoded.dinas_name,
        categories: decoded.categories,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid token', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }
}
