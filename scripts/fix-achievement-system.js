#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAchievementSystem() {
  try {
    console.log('🔧 Corrigindo sistema de conquistas DAILY...\n');

    // Corrigir conquistas específicas que não funcionam
    const achievementUpdates = [
      {
        name: 'Primeira Visita',
        condition: { type: 'first_login' },
        description: 'Faça login pela primeira vez'
      },
      {
        name: 'Dedicação Diária', 
        condition: { type: 'daily_reward', count: 1 },
        description: 'Reivindique sua recompensa diária'
      },
      {
        name: 'Semana Completa',
        condition: { type: 'streak', days: 7 },
        description: 'Mantenha uma sequência de 7 dias consecutivos'
      },
      {
        name: 'Quinze Dias de Fogo',
        condition: { type: 'streak', days: 15 },
        description: 'Mantenha uma sequência de 15 dias consecutivos'
      },
      {
        name: 'Mês Perfeito',
        condition: { type: 'streak', days: 30 },
        description: 'Mantenha uma sequência de 30 dias consecutivos'
      },
      {
        name: 'Lenda do Streak',
        condition: { type: 'streak', days: 60 },
        description: 'Mantenha uma sequência de 60 dias consecutivos'
      },
      {
        name: 'Centenário',
        condition: { type: 'streak', days: 100 },
        description: 'Mantenha uma sequência de 100 dias consecutivos'
      },
      {
        name: 'Veterano Bronze',
        condition: { type: 'total_daily_rewards', count: 50 },
        description: 'Reivindique 50 recompensas diárias no total'
      },
      {
        name: 'Veterano Prata',
        condition: { type: 'total_daily_rewards', count: 100 },
        description: 'Reivindique 100 recompensas diárias no total'
      },
      {
        name: 'Veterano Ouro',
        condition: { type: 'total_daily_rewards', count: 365 },
        description: 'Reivindique 365 recompensas diárias no total'
      },
      {
        name: 'Multiplicador Bronze',
        condition: { type: 'multiplier', tier: 'bronze' },
        description: 'Alcance o multiplicador Bronze de streak (8+ dias)'
      },
      {
        name: 'Multiplicador Prata',
        condition: { type: 'multiplier', tier: 'silver' },
        description: 'Alcance o multiplicador Prata de streak (15+ dias)'
      },
      {
        name: 'Multiplicador Ouro',
        condition: { type: 'multiplier', tier: 'gold' },
        description: 'Alcance o multiplicador Ouro de streak (30+ dias)'
      }
    ];

    console.log('📝 Atualizando condições das conquistas...');
    for (const update of achievementUpdates) {
      const result = await prisma.achievement.updateMany({
        where: { name: update.name },
        data: {
          condition: update.condition,
          description: update.description
        }
      });
      
      if (result.count > 0) {
        console.log(`✅ ${update.name}: condição atualizada`);
      } else {
        console.log(`⚠️ ${update.name}: não encontrada`);
      }
    }

    // Criar conquistas adicionais que estão no AchievementEngine mas não no banco
    const additionalAchievements = [
      {
        name: 'Coletor de Recompensas',
        description: 'Colete 50 recompensas diárias',
        icon: '🎁',
        category: 'DAILY',
        type: 'PROGRESS',
        condition: { type: 'daily_rewards_claimed', target: 50 },
        points: 75,
        isSecret: false
      }
    ];

    console.log('\n🆕 Criando conquistas adicionais...');
    for (const achievement of additionalAchievements) {
      try {
        await prisma.achievement.upsert({
          where: { name: achievement.name },
          update: {
            description: achievement.description,
            condition: achievement.condition,
            points: achievement.points
          },
          create: {
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            type: achievement.type,
            condition: achievement.condition,
            points: achievement.points,
            isSecret: achievement.isSecret,
            isActive: true
          }
        });
        console.log(`✅ ${achievement.name}: criada/atualizada`);
      } catch (error) {
        console.log(`❌ Erro ao criar ${achievement.name}:`, error.message);
      }
    }

    // Testar as conquistas com um evento simulado
    console.log('\n🧪 Testando sistema de conquistas...');
    
    // Buscar usuário admin para teste
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' }
    });

    if (adminUser) {
      console.log(`👤 Testando com usuário: ${adminUser.email}`);
      
      // Simular evento de primeira daily reward
      const { achievementEngine } = await import('../src/lib/achievements.js');
      
      const unlockedAchievements = await achievementEngine.checkAchievements({
        type: 'DAILY_REWARD_CLAIMED',
        userId: adminUser.id,
        data: {
          day: 1,
          streak: 1,
          rewardType: 'CREDITS',
          value: 10,
          bonusMultiplier: 1
        }
      });
      
      console.log(`🏆 Conquistas desbloqueadas no teste: ${unlockedAchievements.length}`);
      unlockedAchievements.forEach(achievementId => {
        console.log(`   - ${achievementId}`);
      });
    }

    console.log('\n✅ Sistema de conquistas DAILY corrigido!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAchievementSystem();