import { NextResponse } from 'next/server'
import { sendWhatsAppNotification, isFonnteConfigured } from '@/lib/fonnte'

export async function GET() {
  const configured = isFonnteConfigured()
  const testNumber = process.env.WA_TEST_NUMBER || '6285155347701'
  
  if (!configured) {
    return NextResponse.json({ 
      error: 'Fonnte not configured',
      FONNTE_TOKEN_SET: !!process.env.FONNTE_TOKEN,
      WA_TEST_NUMBER: testNumber
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
    FONNTE_TOKEN_SET: !!process.env.FONNTE_TOKEN,
  })
}
