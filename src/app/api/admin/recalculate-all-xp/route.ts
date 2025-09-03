import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    // Verificar se é admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    })

    let fixedCount = 0
    let consistentCount = 0
    const results: Array<{
      userId: string;
      email: string;
      previousXP: number;
      correctedXP: number;
      wasFixed: boolean;
    }> = []

    console.log(`🔄 Starting XP recalculation for ${users.length} users...`)

    for (const user of users) {
      try {
        // Buscar conquistas completadas do usuário
        const userAchievements = await prisma.userAchievement.findMany({
          where: {
            userId: user.id,
            isCompleted: true
          },
          include: {
            achievement: {
              select: { points: true }
            }
          }
        })

        const correctXP = userAchievements.reduce((sum, ua) => {
          return sum + ua.achievement.points
        }, 0)

        // Buscar XP atual
        const currentStats = await prisma.userStats.findUnique({
          where: { userId: user.id }
        })

        const currentXP = currentStats?.totalXP || 0

        if (currentXP !== correctXP) {
          // Precisa de correção
          const newLevel = Math.floor(Math.sqrt(correctXP / 100)) + 1

          await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {
              totalXP: correctXP,
              level: newLevel,
              updatedAt: new Date()
            },
            create: {
              userId: user.id,
              totalXP: correctXP,
              level: newLevel,
              lastActivityAt: new Date()
            }
          })

          results.push({
            userId: user.id,
            email: user.email,
            previousXP: currentXP,
            correctedXP: correctXP,
            wasFixed: true
          })

          fixedCount++
          console.log(`🔧 Fixed ${user.email}: ${currentXP} -> ${correctXP} XP`)
        } else {
          // Já consistente
          results.push({
            userId: user.id,
            email: user.email,
            previousXP: currentXP,
            correctedXP: correctXP,
            wasFixed: false
          })

          consistentCount++
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          userId: user.id,
          email: user.email,
          previousXP: -1,
          correctedXP: -1,
          wasFixed: false
        })
      }
    }

    console.log(`✅ XP recalculation complete: ${fixedCount} fixed, ${consistentCount} consistent`)

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        fixedCount,
        consistentCount,
        errorCount: users.length - fixedCount - consistentCount
      },
      results: results.filter(r => r.wasFixed) // Só mostrar os que foram corrigidos
    })
    
  } catch (error) {
    console.error('Error recalculating all XP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}