import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: NextRequest) {
  try {
    const { dinasId, password } = await request.json()
    
    if (!dinasId || !password) {
      return NextResponse.json(
        { success: false, error: 'Dinas ID and password are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
    
    // Get dinas from database
    const { data: dinas, error } = await supabaseAdmin
      .from('dinas')
      .select('*')
      .eq('id', dinasId)
      .eq('is_active', true)
      .single()
    
    if (error || !dinas) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, dinas.password_hash)
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        dinas_id: dinas.id,
        dinas_name: dinas.name,
        categories: dinas.categories,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    // Set cookie
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        dinas: {
          id: dinas.id,
          name: dinas.name,
          categories: dinas.categories,
        },
      },
    })
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
