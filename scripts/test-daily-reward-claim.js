#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDailyRewardClaim() {
  try {
    console.log('🧪 Testando claim de daily reward...\n');

    // Buscar um usuário de teste (admin)
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'admin@admin.com'
      }
    });

    if (!testUser) {
      console.log('❌ Usuário de teste não encontrado');
      return;
    }

    console.log(`👤 Testando com usuário: ${testUser.email}`);

    // Verificar/criar UserStats
    let userStats = await prisma.userStats.findUnique({
      where: { userId: testUser.id }
    });

    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: {
          userId: testUser.id,
          currentStreak: 1
        }
      });
      console.log('📊 UserStats criado');
    }

    const currentStreak = userStats.currentStreak || 1;
    const cycleDay = ((currentStreak - 1) % 7) + 1;

    console.log(`🔥 Streak atual: ${currentStreak}, Dia do ciclo: ${cycleDay}`);

    // Buscar recompensa do dia
    const todayReward = await prisma.dailyReward.findFirst({
      where: { 
        day: cycleDay,
        isActive: true 
      },
      include: {
        packType: {
          select: {
            id: true,
            name: true,
            displayName: true,
            emoji: true
          }
        }
      }
    });

    if (!todayReward) {
      console.log(`❌ Nenhuma recompensa encontrada para o dia ${cycleDay}`);
      return;
    }

    console.log(`🎁 Recompensa do dia ${cycleDay}:`);
    console.log(`   Tipo: ${todayReward.rewardType}`);
    console.log(`   Valor: ${todayReward.rewardValue}`);
    if (todayReward.packType) {
      console.log(`   Tipo de pacote: ${todayReward.packType.displayName}`);
    }

    // Verificar se já foi reclamada
    const existingClaim = await prisma.dailyRewardClaim.findFirst({
      where: {
        userId: testUser.id,
        rewardId: todayReward.id,
        streakDay: currentStreak
      }
    });

    if (existingClaim) {
      console.log('⚠️ Recompensa já foi reclamada hoje');
      return;
    }

    // Simular multiplicador
    let bonusMultiplier = 1;
    if (currentStreak >= 30) {
      bonusMultiplier = 1.25;
    } else if (currentStreak >= 15) {
      bonusMultiplier = 1.15;
    } else if (currentStreak >= 8) {
      bonusMultiplier = 1.08;
    }

    const adjustedValue = Math.floor(todayReward.rewardValue * bonusMultiplier);

    console.log(`💫 Multiplicador: ${bonusMultiplier}x`);
    console.log(`🎯 Valor ajustado: ${adjustedValue}`);

    // Testar busca de pacote se for recompensa PACK
    if (todayReward.rewardType === 'PACK') {
      const availablePack = await prisma.pack.findFirst({
        where: {
          customTypeId: todayReward.packTypeId,
          isActive: true
        }
      });

      if (availablePack) {
        console.log(`📦 Pacote encontrado: ${availablePack.name} (ID: ${availablePack.id})`);
      } else {
        console.log(`❌ Nenhum pacote encontrado para customTypeId: ${todayReward.packTypeId}`);
        return;
      }
    }

    console.log('\n✅ Teste da lógica de claim passou! A API deveria funcionar agora.');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDailyRewardClaim();