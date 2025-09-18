#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDailyRewardsSequence() {
  try {
    console.log('🔧 Corrigindo sequência de recompensas diárias conforme imagem...\n');

    // Sequência correta baseada na imagem original:
    // Dia 1: 10, Dia 2: 15, Dia 3: 1x, Dia 4: 25, Dia 5: 1x, Dia 6: 50, Dia 7: 1x
    
    const correctSequence = [
      { day: 1, rewardType: 'CREDITS', rewardValue: 10, description: 'Dia 1 - 10 créditos' },
      { day: 2, rewardType: 'CREDITS', rewardValue: 15, description: 'Dia 2 - 15 créditos' },
      { day: 3, rewardType: 'PACK', rewardValue: 1, description: 'Dia 3 - 1x Pacote Bronze' },
      { day: 4, rewardType: 'CREDITS', rewardValue: 25, description: 'Dia 4 - 25 créditos' },
      { day: 5, rewardType: 'PACK', rewardValue: 1, description: 'Dia 5 - 1x Pacote Bronze' },
      { day: 6, rewardType: 'CREDITS', rewardValue: 50, description: 'Dia 6 - 50 créditos' },
      { day: 7, rewardType: 'PACK', rewardValue: 1, description: 'Dia 7 - 1x Pacote Prata' }
    ];

    console.log('📝 Aplicando sequência correta de 7 dias...');

    // Primeiro, deletar as recompensas existentes dos primeiros 7 dias
    await prisma.dailyReward.deleteMany({
      where: {
        day: { in: [1, 2, 3, 4, 5, 6, 7] }
      }
    });

    // Criar as recompensas na sequência correta
    for (const reward of correctSequence) {
      await prisma.dailyReward.create({
        data: {
          day: reward.day,
          rewardType: reward.rewardType,
          rewardValue: reward.rewardValue,
          description: reward.description,
          isActive: true
        }
      });
      console.log(`✅ ${reward.description}`);
    }

    // Manter os dias 8-30 com a progressão de multiplicadores
    console.log('\n📈 Mantendo progressão de multiplicadores dias 8-30...');

    // Verificar o resultado
    const updatedRewards = await prisma.dailyReward.findMany({
      where: { day: { lte: 7 } },
      orderBy: { day: 'asc' },
      select: { day: true, rewardType: true, rewardValue: true, description: true }
    });

    console.log('\n📊 Sequência atualizada (primeiros 7 dias):');
    updatedRewards.forEach(reward => {
      const type = reward.rewardType === 'CREDITS' ? '💰' : '📦';
      console.log(`   ${type} Dia ${reward.day}: ${reward.description}`);
    });

    console.log('\n✅ Sequência de recompensas diárias corrigida!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDailyRewardsSequence();