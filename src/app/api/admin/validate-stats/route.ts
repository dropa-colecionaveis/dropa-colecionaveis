import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { statsValidator } = await import('@/lib/stats-validator')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { isAdmin } = await import('@/lib/admin-auth')
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'check') {
      // Verificar inconsistências de estatísticas e XP
      let inconsistencies: any[] = []
      let xpInconsistencies: any[] = []
      let errors: string[] = []

      try {
        inconsistencies = await statsValidator.findInconsistencies()
      } catch (error) {
        console.error('Error finding stats inconsistencies:', error)
        errors.push('Failed to check stats inconsistencies')
      }

      try {
        xpInconsistencies = await statsValidator.findXPInconsistencies()
      } catch (error) {
        console.error('Error finding XP inconsistencies:', error)
        errors.push('Failed to check XP inconsistencies')
      }
      
      return NextResponse.json({
        success: errors.length === 0,
        inconsistencies,
        xpInconsistencies,
        count: inconsistencies.length,
        xpCount: xpInconsistencies.length,
        totalIssues: inconsistencies.length + xpInconsistencies.length,
        errors: errors.length > 0 ? errors : undefined
      })
    } else if (action === 'fix') {
      // Corrigir todas as inconsistências
      const result = await statsValidator.fixAllInconsistencies()
      return NextResponse.json({
        success: true,
        ...result
      })
    } else if (action === 'fix-user') {
      // Corrigir usuário específico
      const userId = url.searchParams.get('userId')
      const type = url.searchParams.get('type') || 'stats'
      
      if (!userId) {
        return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
      }

      let success = false
      if (type === 'xp') {
        success = await statsValidator.fixUserXP(userId)
      } else {
        success = await statsValidator.fixUserStats(userId)
      }
      
      return NextResponse.json({
        success,
        message: success ? `User ${type} fixed successfully` : `Failed to fix user ${type}`
      })
    } else if (action === 'check-xp') {
      // Apenas verificar inconsistências de XP
      const xpInconsistencies = await statsValidator.findXPInconsistencies()
      return NextResponse.json({
        success: true,
        xpInconsistencies,
        count: xpInconsistencies.length
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use: check, fix, or fix-user' }, { status: 400 })
    }

  } catch (error) {
    console.error('Stats validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { statsValidator } = await import('@/lib/stats-validator')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { isAdmin } = await import('@/lib/admin-auth')
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userIds } = await req.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 })
    }

    let fixed = 0
    let failed = 0

    for (const userId of userIds) {
      const success = await statsValidator.fixUserStats(userId)
      if (success) {
        fixed++
      } else {
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      fixed,
      failed,
      total: userIds.length
    })

  } catch (error) {
    console.error('Bulk stats fix error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}