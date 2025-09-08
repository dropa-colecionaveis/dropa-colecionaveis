import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clearCreditPackagesCache } from '@/lib/mercadopago'

// POST - Limpa o cache dos pacotes de crédito
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Limpar cache
    clearCreditPackagesCache()

    return NextResponse.json({ 
      message: 'Credit packages cache cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}