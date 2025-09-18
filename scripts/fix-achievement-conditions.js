#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAchievementConditions() {
  try {
    console.log('🔧 Corrigindo condições das conquistas para funcionar com o AchievementEngine...\n');

    // Mapeamento das condições corretas que o AchievementEngine espera
    const correctConditions = [
      {
        name: 'Primeira Visita',
        condition: [{ type: 'daily_login', target: 1 }], // Compatível com evaluateDailyLoginCondition
        description: 'Faça seu primeiro login diário e ganhe recompensas'
      },
      {
        name: 'Dedicação Diária',
        condition: [{ type: 'daily_rewards_claimed', target: 1 }], // Compatível com evaluateDailyRewardsClaimedCondition
        description: 'Colete sua primeira recompensa diária'
      },
      {
        name: 'Semana Completa',
        condition: [{ type: 'daily_streak', target: 7 }], // Compatível com evaluateDailyStreakCondition
        description: 'Complete 7 dias consecutivos de login diário'
      },
      {
        name: 'Quinze Dias de Fogo',
        condition: [{ type: 'daily_streak', target: 15 }],
        description: 'Complete 15 dias consecutivos de login diário'
      },
      {
        name: 'Mês Perfeito',
        condition: [{ type: 'daily_streak', target: 30 }],
        description: 'Complete 30 dias consecutivos de login diário'
      },
      {
        name: 'Lenda do Streak',
        condition: [{ type: 'daily_streak', target: 60 }],
        description: 'Complete 60 dias consecutivos de login diário'
      },
      {
        name: 'Centenário',
        condition: [{ type: 'daily_streak', target: 100 }],
        description: 'Complete 100 dias consecutivos de login diário'
      },
      {
        name: 'Veterano Bronze',
        condition: [{ type: 'daily_rewards_claimed', target: 50 }],
        description: 'Colete 50 recompensas diárias'
      },
      {
        name: 'Veterano Prata',
        condition: [{ type: 'daily_rewards_claimed', target: 100 }],
        description: 'Colete 100 recompensas diárias'
      },
      {
        name: 'Veterano Ouro',
        condition: [{ type: 'daily_rewards_claimed', target: 365 }],
        description: 'Colete 365 recompensas diárias'
      },
      {
        name: 'Multiplicador Bronze',
        condition: [{ type: 'daily_streak', target: 8 }], // Mudando para streak simples
        description: 'Alcance o multiplicador Bronze de streak (8+ dias)'
      },
      {
        name: 'Multiplicador Prata',
        condition: [{ type: 'daily_streak', target: 15 }], // Mudando para streak simples
        description: 'Alcance o multiplicador Prata de streak (15+ dias)'
      },
      {
        name: 'Multiplicador Ouro',
        condition: [{ type: 'daily_streak', target: 30 }], // Mudando para streak simples
        description: 'Alcance o multiplicador Ouro de streak (30+ dias)'
      },
      {
        name: 'Coletor de Recompensas',
        condition: [{ type: 'daily_rewards_claimed', target: 50 }],
        description: 'Colete 50 recompensas diárias'
      }
    ];

    console.log('📝 Atualizando condições das conquistas...');
    for (const update of correctConditions) {
      const result = await prisma.achievement.updateMany({
        where: { name: update.name },
        data: {
          condition: update.condition,
          description: update.description
        }
      });
      
      if (result.count > 0) {
        console.log(`✅ ${update.name}: condição atualizada para ${JSON.stringify(update.condition)}`);
      } else {
        console.log(`⚠️ ${update.name}: não encontrada`);
      }
    }

    // Verificar se as condições foram salvas corretamente
    console.log('\n📊 Verificando conquistas atualizadas:');
    const updatedAchievements = await prisma.achievement.findMany({
      where: {
        category: 'DAILY'
      },
      select: {
        name: true,
        condition: true,
        points: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    updatedAchievements.forEach(achievement => {
      console.log(`🏆 ${achievement.name} (${achievement.points} pts)`);
      console.log(`   Condição: ${JSON.stringify(achievement.condition)}`);
    });

    console.log('\n✅ Condições das conquistas DAILY corrigidas!');
    console.log('\n🎯 Próximo passo: teste claim de daily reward novamente para verificar se as conquistas desbloqueiam');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAchievementConditions();