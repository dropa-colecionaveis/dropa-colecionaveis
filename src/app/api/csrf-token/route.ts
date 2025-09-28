import { NextRequest } from 'next/server'
import { generateCSRFTokenResponse } from '@/lib/csrf-protection'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { authOptions } = await import('@/lib/auth')
  return generateCSRFTokenResponse(req, authOptions)
}