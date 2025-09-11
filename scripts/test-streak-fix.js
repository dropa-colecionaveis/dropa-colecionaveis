const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testStreakCalculation() {
  console.log('🧪 Testing streak calculation fix...')

  try {
    // Buscar usuários com streak atual > 0
    const usersWithStreak = await prisma.userStats.findMany({
      where: {
        currentStreak: { gt: 0 }
      },
      select: {
        userId: true,
        currentStreak: true,
        lastActivityAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        currentStreak: 'desc'
      },
      take: 10
    })

    console.log(`📊 Found ${usersWithStreak.length} users with recorded streaks`)

    // Calcular streaks atuais dinamicamente
    const { calculateCurrentStreaksForUsers } = require('../dist/lib/streak-calculator.js')
    const userIds = usersWithStreak.map(u => u.userId)
    const actualStreaks = await calculateCurrentStreaksForUsers(userIds)

    console.log('\n📋 Streak Comparison:')
    console.log('=====================================')

    let needsUpdate = 0
    
    for (const user of usersWithStreak) {
      const storedStreak = user.currentStreak
      const actualStreak = actualStreaks[user.userId] || 0
      const username = user.user.name || user.user.email?.split('@')[0] || 'Unknown'
      const lastActivity = user.lastActivityAt ? user.lastActivityAt.toLocaleDateString('pt-BR') : 'Never'
      
      const status = storedStreak !== actualStreak ? '❌ NEEDS UPDATE' : '✅ OK'
      
      if (storedStreak !== actualStreak) {
        needsUpdate++
      }
      
      console.log(`${username.padEnd(20)} | Stored: ${String(storedStreak).padStart(2)} | Actual: ${String(actualStreak).padStart(2)} | Last: ${lastActivity.padEnd(12)} | ${status}`)
    }

    console.log('=====================================')
    console.log(`📈 Summary: ${needsUpdate} users need streak updates`)

    if (needsUpdate > 0) {
      console.log('\n💡 To fix these issues:')
      console.log('1. Run: POST /api/admin/reset-broken-streaks')
      console.log('2. Or execute: node scripts/reset-broken-streaks.js')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStreakCalculation()