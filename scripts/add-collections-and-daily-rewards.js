#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCollectionsAndDailyRewards() {
  try {
    console.log('🚀 Adicionando coleções, temas e recompensas diárias...\n');

    // 1. Criar tema Genesis
    console.log('🎨 Criando tema Genesis...');
    const theme = await prisma.theme.create({
      data: {
        name: 'genesis',
        displayName: 'Genesis - Primeira Era',
        description: 'A coleção primordial, contendo os primeiros itens criados no início de tudo',
        emoji: '🌍',
        colorClass: 'from-purple-500/20 to-indigo-500/20',
        borderClass: 'border-purple-500/30',
        isActive: true,
        isSystem: true
      }
    });
    console.log('✅ Tema Genesis criado');

    // 2. Criar coleção Genesis
    console.log('\n📚 Criando coleção Genesis...');
    const collection = await prisma.collection.create({
      data: {
        name: 'Genesis - Primeira Era',
        description: 'A coleção primordial com 110 itens únicos temáticos sobre a criação e o início de tudo',
        themeId: theme.id,
        imageUrl: 'https://via.placeholder.com/400x600/6366f1/ffffff?text=Genesis+Collection',
        maxItems: 110,
        isActive: true,
        isLimited: false,
        isTemporal: false,
        scarcityLevel: 'MYTHIC',
        totalSupply: 110,
        currentSupply: 110
      }
    });
    console.log('✅ Coleção Genesis criada');

    // 3. Associar todos os itens à coleção
    console.log('\n🔗 Associando itens à coleção Genesis...');
    await prisma.item.updateMany({
      where: {
        name: {
          contains: 'Gênesis'
        }
      },
      data: {
        collectionId: collection.id
      }
    });
    const updatedItems = await prisma.item.count({
      where: { collectionId: collection.id }
    });
    console.log(`✅ ${updatedItems} itens associados à coleção`);

    // 4. Criar Daily Rewards
    console.log('\n🎁 Criando sistema de recompensas diárias...');
    
    const dailyRewards = [
      // Semana 1 - Créditos básicos
      { day: 1, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 1 - 5 créditos' },
      { day: 2, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 2 - 5 créditos' },
      { day: 3, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 3 - 5 créditos' },
      { day: 4, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 4 - 5 créditos' },
      { day: 5, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 5 - 5 créditos' },
      { day: 6, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 6 - 5 créditos' },
      { day: 7, rewardType: 'CREDITS', rewardValue: 10, description: 'Dia 7 - Bônus: 10 créditos!' },
      
      // Semana 2 - Com multiplicador Bronze (8%)
      { day: 8, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 8 - 5 créditos + Multiplicador Bronze' },
      { day: 9, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 9 - 5 créditos' },
      { day: 10, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 10 - 5 créditos' },
      { day: 11, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 11 - 5 créditos' },
      { day: 12, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 12 - 5 créditos' },
      { day: 13, rewardType: 'CREDITS', rewardValue: 5, description: 'Dia 13 - 5 créditos' },
      { day: 14, rewardType: 'CREDITS', rewardValue: 15, description: 'Dia 14 - Bônus: 15 créditos!' },
      
      // Semana 3 - Com multiplicador Prata (15%)
      { day: 15, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 15 - 6 créditos + Multiplicador Prata' },
      { day: 16, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 16 - 6 créditos' },
      { day: 17, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 17 - 6 créditos' },
      { day: 18, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 18 - 6 créditos' },
      { day: 19, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 19 - 6 créditos' },
      { day: 20, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 20 - 6 créditos' },
      { day: 21, rewardType: 'CREDITS', rewardValue: 20, description: 'Dia 21 - Bônus: 20 créditos!' },
      
      // Semana 4
      { day: 22, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 22 - 6 créditos' },
      { day: 23, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 23 - 6 créditos' },
      { day: 24, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 24 - 6 créditos' },
      { day: 25, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 25 - 6 créditos' },
      { day: 26, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 26 - 6 créditos' },
      { day: 27, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 27 - 6 créditos' },
      { day: 28, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 28 - 6 créditos' },
      { day: 29, rewardType: 'CREDITS', rewardValue: 6, description: 'Dia 29 - 6 créditos' },
      
      // Dia 30 - Marco especial com multiplicador Ouro (25%)
      { day: 30, rewardType: 'CREDITS', rewardValue: 50, description: 'Dia 30 - SUPER BÔNUS: 50 créditos + Multiplicador Ouro!' }
    ];

    // Adicionar recompensas especiais com pacotes
    const specialRewards = [
      { day: 7, rewardType: 'PACK', rewardValue: 1, description: 'Dia 7 - Pacote Bronze grátis!', packTypeId: null },
      { day: 14, rewardType: 'PACK', rewardValue: 1, description: 'Dia 14 - Pacote Bronze grátis!', packTypeId: null },
      { day: 21, rewardType: 'PACK', rewardValue: 2, description: 'Dia 21 - Pacote Prata grátis!', packTypeId: null },
      { day: 30, rewardType: 'PACK', rewardValue: 3, description: 'Dia 30 - Pacote Ouro grátis!', packTypeId: null }
    ];

    // Criar recompensas de créditos
    for (const reward of dailyRewards) {
      const existing = await prisma.dailyReward.findFirst({
        where: {
          day: reward.day,
          rewardType: 'CREDITS'
        }
      });

      if (!existing) {
        await prisma.dailyReward.create({
          data: {
            day: reward.day,
            rewardType: 'CREDITS',
            rewardValue: reward.rewardValue,
            description: reward.description,
            isActive: true
          }
        });
      }
    }

    console.log('✅ 30 recompensas diárias de créditos criadas');

    // 5. Criar configuração de streak multipliers
    console.log('\n⚙️ Criando configuração de multiplicadores de streak...');
    
    const streakConfig = {
      baseReward: 5,
      multipliers: [
        { minimumDays: 1, bonusPercentage: 0, tier: 'standard', description: '1-7 dias: Recompensa base' },
        { minimumDays: 8, bonusPercentage: 8, tier: 'bronze', description: '8-14 dias: +8% de bônus' },
        { minimumDays: 15, bonusPercentage: 15, tier: 'silver', description: '15-29 dias: +15% de bônus' },
        { minimumDays: 30, bonusPercentage: 25, tier: 'gold', description: '30+ dias: +25% de bônus' }
      ]
    };

    // Salvar configuração em arquivo para referência
    const fs = require('fs');
    fs.writeFileSync(
      './streak-config.json',
      JSON.stringify(streakConfig, null, 2)
    );
    console.log('✅ Configuração de streak salva em streak-config.json');

    // 6. Verificação final
    console.log('\n📊 Verificação final:');
    const finalCollections = await prisma.collection.count();
    const finalThemes = await prisma.theme.count();
    const finalDailyRewards = await prisma.dailyReward.count();
    const itemsInCollection = await prisma.item.count({
      where: { collectionId: collection.id }
    });

    console.log(`   - Coleções: ${finalCollections}`);
    console.log(`   - Temas: ${finalThemes}`);
    console.log(`   - Daily Rewards: ${finalDailyRewards}`);
    console.log(`   - Itens na coleção Genesis: ${itemsInCollection}/110`);

    console.log('\n✅ Sistema de coleções e recompensas diárias configurado com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCollectionsAndDailyRewards();