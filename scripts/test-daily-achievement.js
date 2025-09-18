#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDailyAchievement() {
  try {
    console.log('🧪 Testando conquistas DAILY manualmente...\n');

    // Buscar usuário admin
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' }
    });

    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }

    console.log(`👤 Testando com usuário: ${adminUser.email}`);

    // Verificar conquista "Dedicação Diária" 
    const dedicacaoAchievement = await prisma.achievement.findFirst({
      where: { name: 'Dedicação Diária' }
    });

    if (!dedicacaoAchievement) {
      console.log('❌ Conquista "Dedicação Diária" não encontrada');
      return;
    }

    console.log(`🏆 Conquista encontrada: ${dedicacaoAchievement.name}`);
    console.log(`   Condição: ${JSON.stringify(dedicacaoAchievement.condition)}`);

    // Verificar se usuário já tem essa conquista
    const existingUserAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: adminUser.id,
          achievementId: dedicacaoAchievement.id
        }
      }
    });

    if (existingUserAchievement?.isCompleted) {
      console.log('✅ Usuário já possui esta conquista');
    } else {
      console.log('⚠️ Usuário ainda não possui esta conquista');
      
      // Verificar quantas daily rewards o usuário já fez claim
      const claimCount = await prisma.dailyRewardClaim.count({
        where: { userId: adminUser.id }
      });
      
      console.log(`📊 Claims de daily reward do usuário: ${claimCount}`);
      
      if (claimCount >= 1) {
        console.log('🎯 Usuário deveria ter desbloqueado "Dedicação Diária"');
        
        // Desbloquear manualmente para teste
        await prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId: adminUser.id,
              achievementId: dedicacaoAchievement.id
            }
          },
          update: {
            isCompleted: true,
            unlockedAt: new Date()
          },
          create: {
            userId: adminUser.id,
            achievementId: dedicacaoAchievement.id,
            isCompleted: true,
            progress: 100
          }
        });
        
        // Adicionar XP
        await prisma.userStats.upsert({
          where: { userId: adminUser.id },
          update: {
            totalXP: { increment: dedicacaoAchievement.points }
          },
          create: {
            userId: adminUser.id,
            totalXP: dedicacaoAchievement.points,
            level: 1
          }
        });
        
        console.log(`✅ Conquista "Dedicação Diária" desbloqueada manualmente (+${dedicacaoAchievement.points} XP)`);
      }
    }

    // Verificar outras conquistas potenciais
    const userStats = await prisma.userStats.findUnique({
      where: { userId: adminUser.id }
    });

    if (userStats) {
      console.log(`\n📊 Stats do usuário:`);
      console.log(`   Streak atual: ${userStats.currentStreak}`);
      console.log(`   XP total: ${userStats.totalXP}`);
      console.log(`   Level: ${userStats.level}`);
      
      // Verificar conquistas de streak baseadas no streak atual
      const streakAchievements = [
        { name: 'Semana Completa', requiredStreak: 7 },
        { name: 'Quinze Dias de Fogo', requiredStreak: 15 },
        { name: 'Mês Perfeito', requiredStreak: 30 }
      ];
      
      for (const streakAch of streakAchievements) {
        if (userStats.currentStreak >= streakAch.requiredStreak) {
          const achievement = await prisma.achievement.findFirst({
            where: { name: streakAch.name }
          });
          
          if (achievement) {
            const hasAchievement = await prisma.userAchievement.findUnique({
              where: {
                userId_achievementId: {
                  userId: adminUser.id,
                  achievementId: achievement.id
                }
              }
            });
            
            if (!hasAchievement?.isCompleted) {
              console.log(`🎯 Pode desbloquear: ${streakAch.name} (streak ${userStats.currentStreak} >= ${streakAch.requiredStreak})`);
            }
          }
        }
      }
    }

    console.log('\n✅ Teste de conquistas DAILY concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDailyAchievement();