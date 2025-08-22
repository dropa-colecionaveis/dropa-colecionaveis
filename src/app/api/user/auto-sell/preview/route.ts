import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { autoSellService } = await import('@/lib/auto-sell')
    
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