import { prisma } from './prisma'
import { achievementEngine } from './achievements'

export class AchievementValidatorService {
  /**
   * Valida e corrige conquistas perdidas para um usuário específico
   */
  async validateUserAchievements(userId: string): Promise<void> {
    console.log(`🔍 Validando conquistas para usuário ${userId}`)
    
    try {
      // Buscar dados do usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userAchievements: {
            include: {
              achievement: true
            }
          },
          packOpenings: true,
          userItems: true,
          userStats: true
        }
      })
      
      if (!user) {
        console.log('❌ Usuário não encontrado')
        return
      }
      
      const issues: string[] = []
      
      // 1. Verificar conquista "Primeira Abertura"
      if (user.packOpenings.length > 0) {
        const hasFirstPackAchievement = user.userAchievements.some(ua => 
          ua.achievement.name === 'Primeira Abertura'
        )
        
        if (!hasFirstPackAchievement) {
          issues.push('Missing "Primeira Abertura" achievement despite opening packs')
          
          // Corrigir: Disparar evento PACK_OPENED para primeiro pacote
          const firstPack = user.packOpenings[0]
          await achievementEngine.checkAchievements({
            type: 'PACK_OPENED',
            userId,
            data: {
              packId: firstPack.packId,
              isFirstPack: true,
              items: []
            }
          })
        }
      }
      
      // 2. Verificar conquista "Primeiro Item"
      if (user.userItems.length > 0) {
        const hasFirstItemAchievement = user.userAchievements.some(ua => 
          ua.achievement.name === 'Primeiro Item'
        )
        
        if (!hasFirstItemAchievement) {
          issues.push('Missing "Primeiro Item" achievement despite having items')
          
          // Corrigir: Disparar evento ITEM_OBTAINED
          await achievementEngine.checkAchievements({
            type: 'ITEM_OBTAINED',
            userId,
            data: {
              itemId: user.userItems[0].itemId,
              isFirst: true
            }
          })
        }
      }
      
      // 3. Verificar consistência de XP
      const expectedXP = user.userAchievements.reduce((total, ua) => total + ua.achievement.points, 0)
      const actualXP = user.userStats?.totalXP || 0
      
      if (Math.abs(expectedXP - actualXP) > 5) { // Tolerância de 5 XP para outras fontes
        issues.push(`XP inconsistency: expected ~${expectedXP}, got ${actualXP}`)
      }
      
      if (issues.length > 0) {
        console.log(`⚠️ Problemas encontrados para ${user.email}:`)
        issues.forEach(issue => console.log(`  - ${issue}`))
        console.log('✅ Tentativas de correção aplicadas')
      } else {
        console.log(`✅ Conquistas consistentes para ${user.email}`)
      }
      
    } catch (error) {
      console.error('❌ Erro na validação de conquistas:', error)
    }
  }
  
  /**
   * Valida conquistas para todos os usuários de teste
   */
  async validateTestUsersAchievements(): Promise<void> {
    console.log('🔍 Validando conquistas de usuários de teste...')
    
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'teste',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true
      }
    })
    
    console.log(`Encontrados ${testUsers.length} usuários de teste`)
    
    for (const user of testUsers) {
      console.log(`\n--- Validando ${user.email} ---`)
      await this.validateUserAchievements(user.id)
    }
    
    console.log('\n🎉 Validação completa!')
  }
  
  /**
   * Executa validação automática quando um novo usuário faz atividades
   */
  async autoValidateAfterActivity(userId: string, activityType: 'PACK_OPENED' | 'ITEM_OBTAINED'): Promise<void> {
    // Aguardar um pouco para dar tempo das conquistas serem processadas
    setTimeout(async () => {
      console.log(`🔄 Auto-validação para usuário ${userId} após ${activityType}`)
      await this.validateUserAchievements(userId)
    }, 2000) // 2 segundos de delay
  }
}

export const achievementValidatorService = new AchievementValidatorService()