#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDailyRewardsPackTypes() {
  try {
    console.log('🔧 Corrigindo tipos de pacotes nas daily rewards...\n');

    // Buscar os IDs dos PackTypeCustom
    const packTypes = await prisma.packTypeCustom.findMany({
      select: { id: true, name: true, displayName: true }
    });

    console.log('📦 Tipos de pacotes encontrados:');
    packTypes.forEach(pt => {
      console.log(`   - ${pt.displayName} (${pt.name}): ${pt.id}`);
    });

    const bronzeType = packTypes.find(pt => pt.name === 'bronze');
    const silverType = packTypes.find(pt => pt.name === 'silver');
    const goldType = packTypes.find(pt => pt.name === 'gold');

    if (!bronzeType || !silverType || !goldType) {
      console.error('❌ Tipos de pacotes não encontrados!');
      return;
    }

    console.log('\n🎁 Atualizando daily rewards...');

    // Atualizar dia 3 (Bronze)
    await prisma.dailyReward.updateMany({
      where: {
        day: 3,
        rewardType: 'PACK'
      },
      data: {
        packTypeId: bronzeType.id,
        description: 'Dia 3 - 1x Pacote Bronze'
      }
    });
    console.log('✅ Dia 3: Pacote Bronze configurado');

    // Atualizar dia 5 (Bronze)
    await prisma.dailyReward.updateMany({
      where: {
        day: 5,
        rewardType: 'PACK'
      },
      data: {
        packTypeId: bronzeType.id,
        description: 'Dia 5 - 1x Pacote Bronze'
      }
    });
    console.log('✅ Dia 5: Pacote Bronze configurado');

    // Atualizar dia 7 (Prata)
    await prisma.dailyReward.updateMany({
      where: {
        day: 7,
        rewardType: 'PACK'
      },
      data: {
        packTypeId: silverType.id,
        description: 'Dia 7 - 1x Pacote Prata'
      }
    });
    console.log('✅ Dia 7: Pacote Prata configurado');

    // Verificar resultado
    const updatedRewards = await prisma.dailyReward.findMany({
      where: {
        rewardType: 'PACK'
      },
      include: {
        packType: {
          select: { name: true, displayName: true }
        }
      },
      orderBy: { day: 'asc' }
    });

    console.log('\n📊 Recompensas de pacote atualizadas:');
    updatedRewards.forEach(reward => {
      console.log(`   Dia ${reward.day}: ${reward.packType?.displayName || 'SEM TIPO'} (${reward.description})`);
    });

    console.log('\n✅ Daily rewards de pacotes corrigidas!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDailyRewardsPackTypes();