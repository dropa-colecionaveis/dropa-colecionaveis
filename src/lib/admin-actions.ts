import { prisma } from './prisma'
import { AdminUser } from './admin-auth'
import { createAuditLog, AUDIT_ACTIONS } from './audit-log'
import fs from 'fs/promises'
import path from 'path'

/**
 * Recarrega as estatísticas do sistema
 */
export async function reloadSystemStats(adminUser: AdminUser) {
  try {
    const stats = await getSystemStats()
    
    await createAuditLog(adminUser.id, {
      action: AUDIT_ACTIONS.SYSTEM_STATS_VIEW,
      description: 'Recarregou estatísticas do sistema',
      metadata: { stats }
    })

    return { success: true, stats }
  } catch (error) {
    console.error('Error reloading system stats:', error)
    throw new Error('Falha ao recarregar estatísticas')
  }
}

/**
 * Obtém estatísticas detalhadas do sistema
 */
export async function getSystemStats() {
  const [
    totalUsers,
    totalItems,
    totalPacksOpened,
    totalTransactions,
    totalCreditsResult,
    totalMarketplaceListings,
    recentUsers,
    totalAchievements,
    totalCollections
  ] = await Promise.all([
    prisma.user.count(),
    prisma.item.count({ where: { isActive: true } }),
    prisma.packOpening.count(),
    prisma.transaction.count(),
    prisma.user.aggregate({ _sum: { credits: true } }),
    prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
        }
      }
    }),
    prisma.achievement.count({ where: { isActive: true } }),
    prisma.collection.count({ where: { isActive: true } })
  ])

  return {
    totalUsers,
    totalItems,
    totalPacksOpened,
    totalTransactions,
    totalCreditsInSystem: totalCreditsResult._sum.credits || 0,
    totalMarketplaceListings,
    newUsersThisWeek: recentUsers,
    totalAchievements,
    totalCollections,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Reseta dados de teste (apenas em desenvolvimento)
 */
export async function resetTestData(adminUser: AdminUser) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Reset de dados não permitido em produção')
  }

  try {
    // Backup before reset
    const backupData = await createSystemBackup()
    
    // Reset data (manter apenas usuários admin)
    await prisma.$transaction([
      prisma.marketplaceTransaction.deleteMany({}),
      prisma.marketplaceListing.deleteMany({}),
      prisma.userItem.deleteMany({
        where: {
          user: {
            role: 'USER'
          }
        }
      }),
      prisma.packOpening.deleteMany({
        where: {
          user: {
            role: 'USER'
          }
        }
      }),
      prisma.transaction.deleteMany({
        where: {
          user: {
            role: 'USER'
          }
        }
      }),
      prisma.userAchievement.deleteMany({
        where: {
          user: {
            role: 'USER'
          }
        }
      }),
      prisma.userStats.deleteMany({
        where: {
          user: {
            role: 'USER'
          }
        }
      }),
      prisma.user.deleteMany({
        where: {
          role: 'USER'
        }
      })
    ])

    await createAuditLog(adminUser.id, {
      action: 'SYSTEM_RESET_TEST_DATA',
      description: 'Resetou dados de teste do sistema',
      metadata: { 
        backupCreated: true,
        backupData: backupData.filename
      }
    })

    return { 
      success: true, 
      message: 'Dados de teste resetados com sucesso',
      backupCreated: backupData.filename
    }
  } catch (error) {
    console.error('Error resetting test data:', error)
    throw new Error('Falha ao resetar dados de teste')
  }
}

/**
 * Gera relatório do sistema
 */
export async function generateSystemReport(adminUser: AdminUser) {
  try {
    const stats = await getSystemStats()
    
    // Dados adicionais para o relatório
    const [
      topUsers,
      rarityDistribution,
      marketplaceStats,
      recentActivity
    ] = await Promise.all([
      // Top 10 usuários por XP
      prisma.userStats.findMany({
        take: 10,
        orderBy: { totalXP: 'desc' },
        include: {
          user: {
            select: { email: true, name: true, createdAt: true }
          }
        }
      }),
      
      // Distribuição de itens por raridade
      prisma.item.groupBy({
        by: ['rarity'],
        _count: { rarity: true },
        where: { isActive: true }
      }),
      
      // Estatísticas do marketplace
      prisma.marketplaceTransaction.aggregate({
        _sum: { amount: true },
        _avg: { amount: true },
        _count: { id: true },
        where: { status: 'COMPLETED' }
      }),
      
      // Atividade recente (últimos 30 dias)
      prisma.packOpening.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: adminUser.email,
      systemStats: stats,
      topUsers: topUsers.map(user => ({
        email: user.user.email,
        name: user.user.name,
        totalXP: user.totalXP,
        level: user.level,
        registeredAt: user.user.createdAt
      })),
      rarityDistribution,
      marketplaceStats: {
        totalVolume: marketplaceStats._sum.amount || 0,
        averagePrice: marketplaceStats._avg.amount || 0,
        totalTransactions: marketplaceStats._count || 0
      },
      activityTrend: recentActivity.length
    }

    await createAuditLog(adminUser.id, {
      action: 'SYSTEM_REPORT_GENERATED',
      description: 'Gerou relatório do sistema',
      metadata: { 
        reportStats: {
          topUsersCount: topUsers.length,
          rarityTypes: rarityDistribution.length,
          marketplaceVolume: marketplaceStats._sum.amount
        }
      }
    })

    return { success: true, report }
  } catch (error) {
    console.error('Error generating system report:', error)
    throw new Error('Falha ao gerar relatório do sistema')
  }
}

/**
 * Cria backup do sistema
 */
export async function createSystemBackup(adminUser?: AdminUser) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${timestamp}.json`
    
    // Buscar todos os dados principais
    const [
      users,
      items,
      packs,
      collections,
      achievements,
      marketplaceListings,
      userItems,
      userStats
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.item.findMany(),
      prisma.pack.findMany({ include: { probabilities: true } }),
      prisma.collection.findMany(),
      prisma.achievement.findMany(),
      prisma.marketplaceListing.findMany(),
      prisma.userItem.findMany(),
      prisma.userStats.findMany()
    ])

    const backupData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: adminUser?.email || 'system',
      data: {
        users: users.map(user => ({
          ...user,
          password: '[HIDDEN]' // Não incluir senhas no backup
        })),
        items,
        packs,
        collections,
        achievements,
        marketplaceListings,
        userItems,
        userStats
      },
      statistics: {
        totalUsers: users.length,
        totalItems: items.length,
        totalPacks: packs.length,
        totalCollections: collections.length
      }
    }

    // Salvar backup em arquivo (em produção, usar cloud storage)
    const backupDir = path.join(process.cwd(), 'backups')
    await fs.mkdir(backupDir, { recursive: true })
    
    const filePath = path.join(backupDir, filename)
    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2))

    if (adminUser) {
      await createAuditLog(adminUser.id, {
        action: AUDIT_ACTIONS.SYSTEM_BACKUP,
        description: `Criou backup do sistema: ${filename}`,
        metadata: { 
          filename,
          fileSize: (await fs.stat(filePath)).size,
          statistics: backupData.statistics
        }
      })
    }

    return { 
      success: true, 
      filename,
      statistics: backupData.statistics,
      filePath
    }
  } catch (error) {
    console.error('Error creating system backup:', error)
    throw new Error('Falha ao criar backup do sistema')
  }
}

/**
 * Lista backups disponíveis
 */
export async function listSystemBackups() {
  try {
    const backupDir = path.join(process.cwd(), 'backups')
    
    try {
      const files = await fs.readdir(backupDir)
      const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      
      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(backupDir, file)
          const stats = await fs.stat(filePath)
          
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          }
        })
      )
      
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (dirError) {
      // Diretório não existe ainda
      return []
    }
  } catch (error) {
    console.error('Error listing backups:', error)
    throw new Error('Falha ao listar backups')
  }
}

/**
 * Inicializa dados demo/seed se o sistema estiver vazio
 */
export async function initializeSeedData(adminUser: AdminUser) {
  try {
    const userCount = await prisma.user.count()
    
    if (userCount > 5) { // Já tem dados suficientes
      throw new Error('Sistema já possui dados. Use reset para limpar primeiro.')
    }

    // Criar dados demo básicos
    // (Implementar conforme necessário)
    
    await createAuditLog(adminUser.id, {
      action: 'SYSTEM_SEED_DATA_INIT',
      description: 'Inicializou dados demo do sistema',
      metadata: { userCountBefore: userCount }
    })

    return { success: true, message: 'Dados demo inicializados' }
  } catch (error) {
    console.error('Error initializing seed data:', error)
    throw new Error(error instanceof Error ? error.message : 'Falha ao inicializar dados demo')
  }
}