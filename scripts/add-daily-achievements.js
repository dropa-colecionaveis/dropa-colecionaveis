#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dailyAchievements = [
  {
    name: 'Primeira Visita',
    description: 'Faça login pela primeira vez',
    icon: '🌟',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'first_login' },
    points: 10,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Dedicação Diária',
    description: 'Reivindique sua recompensa diária',
    icon: '📅',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'daily_reward', count: 1 },
    points: 5,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Semana Completa',
    description: 'Mantenha uma sequência de 7 dias consecutivos',
    icon: '📆',
    category: 'DAILY',
    type: 'STREAK',
    condition: { type: 'streak', days: 7 },
    points: 25,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Quinze Dias de Fogo',
    description: 'Mantenha uma sequência de 15 dias consecutivos',
    icon: '🔥',
    category: 'DAILY',
    type: 'STREAK',
    condition: { type: 'streak', days: 15 },
    points: 50,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Mês Perfeito',
    description: 'Mantenha uma sequência de 30 dias consecutivos',
    icon: '🏆',
    category: 'DAILY',
    type: 'STREAK',
    condition: { type: 'streak', days: 30 },
    points: 100,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Lenda do Streak',
    description: 'Mantenha uma sequência de 60 dias consecutivos',
    icon: '💎',
    category: 'DAILY',
    type: 'STREAK',
    condition: { type: 'streak', days: 60 },
    points: 200,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Centenário',
    description: 'Mantenha uma sequência de 100 dias consecutivos',
    icon: '👑',
    category: 'DAILY',
    type: 'STREAK',
    condition: { type: 'streak', days: 100 },
    points: 500,
    isSecret: true,
    isActive: true
  },
  {
    name: 'Veterano Bronze',
    description: 'Reivindique 50 recompensas diárias no total',
    icon: '🥉',
    category: 'DAILY',
    type: 'PROGRESS',
    condition: { type: 'total_daily_rewards', count: 50 },
    points: 30,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Veterano Prata',
    description: 'Reivindique 100 recompensas diárias no total',
    icon: '🥈',
    category: 'DAILY',
    type: 'PROGRESS',
    condition: { type: 'total_daily_rewards', count: 100 },
    points: 60,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Veterano Ouro',
    description: 'Reivindique 365 recompensas diárias no total',
    icon: '🥇',
    category: 'DAILY',
    type: 'PROGRESS',
    condition: { type: 'total_daily_rewards', count: 365 },
    points: 150,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Madrugador',
    description: 'Reivindique uma recompensa diária entre 5h e 7h da manhã',
    icon: '🌅',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'early_bird', time_start: '05:00', time_end: '07:00' },
    points: 15,
    isSecret: true,
    isActive: true
  },
  {
    name: 'Coruja Noturna',
    description: 'Reivindique uma recompensa diária após meia-noite',
    icon: '🦉',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'night_owl', time_after: '00:00' },
    points: 15,
    isSecret: true,
    isActive: true
  },
  {
    name: 'Fim de Semana Ativo',
    description: 'Reivindique recompensas todos os sábados e domingos de um mês',
    icon: '🎉',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'weekend_warrior', weekends_in_month: 4 },
    points: 40,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Recomeço',
    description: 'Recupere sua sequência após perdê-la (mínimo 7 dias antes)',
    icon: '🔄',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'comeback', previous_streak_min: 7 },
    points: 20,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Multiplicador Bronze',
    description: 'Alcance o multiplicador Bronze de streak (8+ dias)',
    icon: '⭐',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'multiplier', tier: 'bronze' },
    points: 15,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Multiplicador Prata',
    description: 'Alcance o multiplicador Prata de streak (15+ dias)',
    icon: '⭐⭐',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'multiplier', tier: 'silver' },
    points: 30,
    isSecret: false,
    isActive: true
  },
  {
    name: 'Multiplicador Ouro',
    description: 'Alcance o multiplicador Ouro de streak (30+ dias)',
    icon: '⭐⭐⭐',
    category: 'DAILY',
    type: 'MILESTONE',
    condition: { type: 'multiplier', tier: 'gold' },
    points: 60,
    isSecret: false,
    isActive: true
  }
];

async function addDailyAchievements() {
  try {
    console.log('🎯 Adicionando conquistas de recompensa diária...\n');

    let added = 0;
    let skipped = 0;

    for (const achievement of dailyAchievements) {
      // Verificar se já existe
      const exists = await prisma.achievement.findUnique({
        where: { name: achievement.name }
      });

      if (exists) {
        console.log(`⏭️ Pulando: ${achievement.name} (já existe)`);
        skipped++;
      } else {
        await prisma.achievement.create({
          data: achievement
        });
        console.log(`✅ Adicionada: ${achievement.name} (${achievement.points} pontos)`);
        added++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   - ${added} conquistas adicionadas`);
    console.log(`   - ${skipped} conquistas já existentes`);

    // Verificar total
    const totalAchievements = await prisma.achievement.count();
    const dailyCount = await prisma.achievement.count({
      where: { category: 'DAILY' }
    });

    console.log(`\n📈 Total de conquistas no sistema: ${totalAchievements}`);
    console.log(`   - Conquistas DAILY: ${dailyCount}`);
    
    // Listar por categoria
    const categories = await prisma.achievement.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    console.log('\n📋 Distribuição por categoria:');
    categories.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat._count.category} conquistas`);
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar conquistas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDailyAchievements();