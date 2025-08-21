import { PrismaClient } from '@prisma/client'
import { achievementEngine } from '../src/lib/achievements'

const prisma = new PrismaClient()

async function main() {
  console.log('🏆 Initializing achievements...')
  
  try {
    await achievementEngine.initializeAchievements()
    console.log('✅ Achievements initialized successfully')
    
    // Listar conquistas criadas
    const achievements = await prisma.achievement.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        points: true
      },
      orderBy: [
        { category: 'asc' },
        { points: 'asc' }
      ]
    })
    
    console.log(`📊 Created ${achievements.length} achievements:`)
    
    const categories = ['COLLECTOR', 'EXPLORER', 'TRADER', 'MILESTONE', 'SPECIAL']
    
    for (const category of categories) {
      const categoryAchievements = achievements.filter(a => a.category === category)
      if (categoryAchievements.length > 0) {
        console.log(`\n${category}:`)
        categoryAchievements.forEach(achievement => {
          console.log(`  - ${achievement.name} (${achievement.points} XP)`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error initializing achievements:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })