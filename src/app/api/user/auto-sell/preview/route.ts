import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autoSellService } from '@/lib/auto-sell'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Obter prévia dos itens que serão vendidos
    const preview = await autoSellService.getAutoSellPreview(session.user.id)

    return NextResponse.json(preview)
  } catch (error) {
    console.error('Auto-sell preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}