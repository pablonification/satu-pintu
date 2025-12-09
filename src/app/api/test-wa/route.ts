import { NextResponse } from 'next/server'
import { sendWhatsAppNotification, isFonnteConfigured } from '@/lib/fonnte'

export async function GET() {
  // Debug: List ALL env vars that start with common prefixes
  const allEnvKeys = Object.keys(process.env).filter(k => 
    k.includes('FONNTE') || 
    k.includes('WA_') || 
    k.includes('NEXT_') ||
    k.includes('VERCEL')
  )
  
  const configured = isFonnteConfigured()
  const testNumber = process.env.WA_TEST_NUMBER || '6285155347701'
  const fonnteToken = process.env.FONNTE_API_TOKEN || ''
  
  // Debug: show first 5 and last 5 chars of token
  const tokenPreview = fonnteToken 
    ? `${fonnteToken.substring(0, 5)}...${fonnteToken.substring(fonnteToken.length - 5)}`
    : '(empty)'
  
  if (!configured) {
    return NextResponse.json({ 
      error: 'Fonnte not configured',
      FONNTE_API_TOKEN_SET: !!process.env.FONNTE_API_TOKEN,
      FONNTE_API_TOKEN_LENGTH: fonnteToken.length,
      FONNTE_API_TOKEN_PREVIEW: tokenPreview,
      WA_TEST_NUMBER: testNumber,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      ALL_RELEVANT_ENV_KEYS: allEnvKeys,
    })
  }

  const result = await sendWhatsAppNotification(
    testNumber,
    `[TEST] SatuPintu WA Test - ${new Date().toISOString()}`
  )

  return NextResponse.json({
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    target: testNumber,
    FONNTE_API_TOKEN_SET: !!process.env.FONNTE_API_TOKEN,
    FONNTE_API_TOKEN_PREVIEW: tokenPreview,
  })
}
