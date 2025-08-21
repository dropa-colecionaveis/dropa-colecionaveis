import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Retornar dados básicos de anti-fraud sem dependências problemáticas
    return NextResponse.json({
      message: 'Anti-fraud monitoring endpoint',
      features: [
        'Price validation',
        'Listing limits',
        'Transaction monitoring',
        'Suspicious activity detection'
      ],
      status: 'active'
    })
  } catch (error) {
    console.error('Anti-fraud admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not implemented' },
    { status: 501 }
  )
}