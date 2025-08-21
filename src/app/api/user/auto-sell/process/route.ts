import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autoSellService } from '@/lib/auto-sell'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[AUTO-SELL] Manual processing triggered by user ${session.user.id}`)

    const stats = await autoSellService.processUserAutoSell(session.user.id)

    return NextResponse.json({
      success: true,
      stats,
      message: `Processed ${stats.totalProcessed} items. ${stats.successfulSales} sold, ${stats.skippedItems} skipped, ${stats.errors} errors.`
    })
  } catch (error) {
    console.error('Auto-sell manual process error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}