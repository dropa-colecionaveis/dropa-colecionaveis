import { prisma } from './prisma'
import { Rarity, ListingStatus } from '@prisma/client'
import { userStatsService } from './user-stats'

// Fixed selling percentages by rarity (cannot be changed by users)
// Sistema Equilibrado - reduz regressividade e torna mais justo para itens raros
const FIXED_SELLING_PERCENTAGES = {
  COMUM: 35,      // 35% de 5 créditos = 1.75 → 2 créditos (perda 60%)
  INCOMUM: 40,    // 40% de 15 créditos = 6 créditos (perda 60%)
  RARO: 45,       // 45% de 40 créditos = 18 créditos (perda 55%)
  EPICO: 50,      // 50% de 100 créditos = 50 créditos (perda 50%)
  LENDARIO: 55    // 55% de 500 créditos = 275 créditos (perda 45%)
} as const

export interface AutoSellStats {
  totalProcessed: number
  successfulSales: number
  skippedItems: number
  errors: number
  creditsGenerated: number
}

export class AutoSellService {
  // Obter prévia dos itens que serão vendidos
  async getAutoSellPreview(userId: string) {
    const config = await prisma.autoSellConfig.findUnique({
      where: { userId }
    })

    if (!config) {
      return {
        items: [],
        totalItems: 0,
        totalCredits: 0,
        message: 'Configuração de venda em lote não encontrada'
      }
    }

    // LIMITE DIÁRIO REMOVIDO PARA VENDA MANUAL
    // Para venda manual em lote, não aplicamos limite diário
    // O usuário tem controle total de quantos itens vender
    console.log(`[AUTO-SELL] Venda manual em lote - ignorando limite diário para usuário ${userId}`)

    // Buscar itens elegíveis
    const eligibleItems = await this.findEligibleItems(userId, config)
    const itemsToSell = eligibleItems // Sem limite - vender todos os elegíveis

    // Calcular preview
    const preview = itemsToSell.map(userItem => {
      const salePrice = this.calculateAutoSellPrice(userItem.item.value, userItem.item.rarity, config)
      return {
        id: userItem.id,
        name: userItem.item.name,
        rarity: userItem.item.rarity,
        baseValue: userItem.item.value,
        salePrice: salePrice,
        imageUrl: userItem.item.imageUrl,
        isLimitedEdition: !!userItem.limitedEditionId
      }
    })

    const totalCredits = preview.reduce((sum, item) => sum + item.salePrice, 0)

    return {
      items: preview,
      totalItems: preview.length,
      totalCredits,
      message: preview.length === 0 ? 'Nenhum item elegível para venda' : `${preview.length} item(ns) serão vendidos por ${totalCredits} créditos`
    }
  }

  // Processar auto-sell para um usuário específico
  async processUserAutoSell(userId: string): Promise<AutoSellStats> {
    const stats: AutoSellStats = {
      totalProcessed: 0,
      successfulSales: 0,
      skippedItems: 0,
      errors: 0,
      creditsGenerated: 0
    }

    const config = await prisma.autoSellConfig.findUnique({
      where: { userId }
    })

    if (!config) {
      await this.logAutoSell(userId, '', '', 0, config, 'SKIPPED', 'Batch sell config not found')
      return stats
    }

    // LIMITE DIÁRIO REMOVIDO PARA VENDA MANUAL  
    // Para venda manual em lote, não aplicamos limite diário
    // O usuário tem controle total de quantos itens vender
    console.log(`[AUTO-SELL] Venda manual em lote - ignorando limite diário para usuário ${userId}`)

    // DELAY ENTRE VENDAS REMOVIDO PARA VENDA MANUAL
    // Para venda manual em lote, não aplicamos delay entre vendas
    // O usuário tem controle total de quando executar
    console.log(`[AUTO-SELL] Venda manual em lote - ignorando delay entre vendas para usuário ${userId}`)

    // Buscar itens elegíveis para venda
    const eligibleItems = await this.findEligibleItems(userId, config)
    stats.totalProcessed = eligibleItems.length

    if (eligibleItems.length === 0) {
      return stats
    }

    for (const userItem of eligibleItems) {
      try {
        // LIMITE DIÁRIO REMOVIDO - vender todos os itens elegíveis
        const salePrice = this.calculateAutoSellPrice(userItem.item.value, userItem.item.rarity, config)
        
        // Venda automática direta - remover item e adicionar créditos
        await prisma.$transaction(async (tx) => {
          // 1. Remover o item do usuário
          await tx.userItem.delete({
            where: { id: userItem.id }
          })

          // 2. Adicionar créditos ao usuário
          await tx.user.update({
            where: { id: userId },
            data: {
              credits: {
                increment: salePrice
              }
            }
          })

          // 3. Criar transação de crédito
          await tx.transaction.create({
            data: {
              userId,
              type: 'MARKETPLACE_SALE',
              amount: salePrice,
              description: `🤖 Venda Automática - ${userItem.item.name}`
            }
          })

          // 4. Log da venda (movido para fora da transação)
        }, {
          timeout: 15000 // Aumenta timeout para 15 segundos
        })

        // Log da venda fora da transação para não afetar performance
        await this.logAutoSell(userId, userItem.id, userItem.item.name, salePrice, config, 'SUCCESS', 'Direct auto-sale')
        
        // Atualizar stats do usuário para decrementar totalItemsCollected
        await userStatsService.trackAutoSell(userId, userItem.item.id, salePrice)
        
        stats.successfulSales++
        stats.creditsGenerated += salePrice

      } catch (error) {
        console.error(`Auto-sell error for item ${userItem.id}:`, error)
        await this.logAutoSell(userId, userItem.id, userItem.item.name, 0, config, 'FAILED', error instanceof Error ? error.message : 'Unknown error')
        stats.errors++
      }
    }

    return stats
  }

  // Encontrar itens elegíveis para venda automática
  private async findEligibleItems(userId: string, config: any) {
    console.log(`[AUTO-SELL] Buscando itens elegíveis para usuário ${userId}`)
    console.log(`[AUTO-SELL] Config recebida:`, JSON.stringify(config, null, 2))
    
    const rarityFilters: Rarity[] = []
    
    if (config.sellCommon) rarityFilters.push('COMUM')
    if (config.sellUncommon) rarityFilters.push('INCOMUM')
    if (config.sellRare) rarityFilters.push('RARO')
    if (config.sellEpic) rarityFilters.push('EPICO')
    if (config.sellLegendary) rarityFilters.push('LENDARIO')

    console.log(`[AUTO-SELL] Filtros de raridade aplicados:`, rarityFilters)

    if (rarityFilters.length === 0) {
      console.log(`[AUTO-SELL] Nenhuma raridade selecionada para venda`)
      return []
    }

    const where: any = {
      userId,
      item: {
        rarity: {
          in: rarityFilters
        }
        // FILTROS DE VALOR REMOVIDOS - vender todos os itens das raridades selecionadas
      },
      // Não incluir itens já listados
      marketplaceListings: {
        none: {
          status: ListingStatus.ACTIVE
        }
      },
      // Não incluir itens protegidos
      protection: null
    }

    // Filtro de edição limitada
    if (!config.sellLimitedEd) {
      where.limitedEditionId = null
    }

    const allEligibleItems = await prisma.userItem.findMany({
      where,
      include: {
        item: true,
        limitedEdition: {
          include: {
            item: true
          }
        }
      },
      orderBy: [
        { item: { rarity: 'asc' } }, // Vender itens comuns primeiro
        { obtainedAt: 'asc' }        // Vender itens mais antigos primeiro
      ]
    })

    console.log(`[AUTO-SELL] Encontrados ${allEligibleItems.length} itens antes da filtragem keepQuantity`)
    
    // Aplicar lógica de keepQuantity - manter X itens de cada tipo
    if (config.keepQuantity > 0) {
      const itemCounts: Record<string, number> = {}
      const filteredItems = []

      for (const userItem of allEligibleItems) {
        const itemKey = userItem.item.id
        const currentCount = itemCounts[itemKey] || 0
        
        if (currentCount < config.keepQuantity) {
          itemCounts[itemKey] = currentCount + 1
          console.log(`[AUTO-SELL] Mantendo item ${userItem.item.name} (${currentCount + 1}/${config.keepQuantity})`)
          // Skip este item (manter)
        } else {
          console.log(`[AUTO-SELL] Adicionando para venda: ${userItem.item.name} (${userItem.item.rarity})`)
          filteredItems.push(userItem)
        }
      }

      console.log(`[AUTO-SELL] Após keepQuantity: ${filteredItems.length} itens para vender`)
      return filteredItems
    }

    console.log(`[AUTO-SELL] Sem keepQuantity: ${allEligibleItems.length} itens para vender`)
    return allEligibleItems
  }

  // Calcular preço de venda automática usando percentuais fixos
  private calculateAutoSellPrice(baseValue: number, rarity: Rarity, config: any): number {
    const percentage = FIXED_SELLING_PERCENTAGES[rarity] || 30 // Default to COMUM percentage if not found

    const calculatedPrice = baseValue * (percentage / 100)
    // Arredondar para cima valores decimais (1.5 → 2, 1.1 → 2) para ser justo com o usuário
    const roundedPrice = Math.ceil(calculatedPrice)
    return Math.max(1, roundedPrice) // Mínimo 1 crédito
  }

  // Registrar log de auto-sell
  private async logAutoSell(
    userId: string,
    userItemId: string,
    itemName: string,
    price: number,
    config: any,
    status: string,
    reason?: string,
    listingId?: string
  ) {
    await prisma.autoSellLog.create({
      data: {
        userId,
        userItemId,
        itemName,
        price,
        configUsed: config ? JSON.parse(JSON.stringify(config)) : {},
        status,
        reason,
        listingId
      }
    })
  }

  // Obter configuração de auto-sell do usuário
  async getAutoSellConfig(userId: string) {
    return await prisma.autoSellConfig.findUnique({
      where: { userId }
    })
  }

  // Atualizar configuração de auto-sell
  async updateAutoSellConfig(userId: string, configData: any) {
    return await prisma.autoSellConfig.upsert({
      where: { userId },
      update: {
        ...configData,
        updatedAt: new Date()
      },
      create: {
        userId,
        ...configData
      }
    })
  }

  // Obter estatísticas de auto-sell do usuário
  async getAutoSellStats(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.autoSellLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate
        }
      }
    })

    const stats = {
      totalItems: logs.length,
      successfulSales: logs.filter(l => l.status === 'SUCCESS').length,
      skippedItems: logs.filter(l => l.status === 'SKIPPED').length,
      failedSales: logs.filter(l => l.status === 'FAILED').length,
      totalCredits: logs.filter(l => l.status === 'SUCCESS').reduce((sum, l) => sum + Math.floor(l.price * 0.95), 0),
      averagePrice: 0,
      rarityBreakdown: {} as Record<string, number>
    }

    const successfulLogs = logs.filter(l => l.status === 'SUCCESS')
    if (successfulLogs.length > 0) {
      stats.averagePrice = Math.round(successfulLogs.reduce((sum, l) => sum + l.price, 0) / successfulLogs.length)
    }

    return stats
  }

  // Proteger/desproteger item
  async toggleItemProtection(userId: string, userItemId: string, protect: boolean, reason?: string) {
    if (protect) {
      return await prisma.userItemProtection.upsert({
        where: { userItemId },
        update: {
          protected: true,
          reason: reason || 'manual',
          updatedAt: new Date()
        },
        create: {
          userId,
          userItemId,
          protected: true,
          reason: reason || 'manual'
        }
      })
    } else {
      return await prisma.userItemProtection.delete({
        where: { userItemId }
      }).catch(() => null) // Ignore se não existir
    }
  }

  // Vender um item individual usando lógica de auto-sell
  async sellSingleItem(userId: string, userItemId: string): Promise<{
    success: boolean
    error?: string
    message?: string
    salePrice?: number
    itemName?: string
    creditsReceived?: number
  }> {
    try {
      // 1. Verificar se o usuário possui o item
      const userItem = await prisma.userItem.findFirst({
        where: {
          id: userItemId,
          userId: userId
        },
        include: {
          item: true,
          limitedEdition: true,
          marketplaceListings: {
            where: {
              status: ListingStatus.ACTIVE
            }
          },
          protection: true
        }
      })

      if (!userItem) {
        return {
          success: false,
          error: 'Item não encontrado ou não pertence ao usuário'
        }
      }

      // 2. Verificar se o item está protegido
      if (userItem.protection && userItem.protection.protected) {
        return {
          success: false,
          error: 'Este item está protegido contra venda'
        }
      }

      // 3. Verificar se o item já está listado no marketplace
      if (userItem.marketplaceListings && userItem.marketplaceListings.length > 0) {
        return {
          success: false,
          error: 'Este item já está listado no marketplace'
        }
      }

      // 4. Calcular preço de venda
      const salePrice = this.calculateAutoSellPrice(userItem.item.value, userItem.item.rarity, null)

      // 5. Executar venda em transação
      await prisma.$transaction(async (tx) => {
        // Remover o item do usuário
        await tx.userItem.delete({
          where: { id: userItem.id }
        })

        // Adicionar créditos ao usuário
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: salePrice
            }
          }
        })

        // Criar transação de crédito
        await tx.transaction.create({
          data: {
            userId,
            type: 'MARKETPLACE_SALE',
            amount: salePrice,
            description: `🤖 Venda Automática Individual - ${userItem.item.name}`
          }
        })
      }, {
        timeout: 15000
      })

      // 6. Log da venda
      await this.logAutoSell(
        userId, 
        userItem.id, 
        userItem.item.name, 
        salePrice, 
        { individual: true }, 
        'SUCCESS', 
        'Individual auto-sale'
      )

      // 7. Atualizar stats do usuário
      await userStatsService.trackAutoSell(userId, userItem.item.id, salePrice)

      return {
        success: true,
        message: `${userItem.item.name} vendido com sucesso!`,
        salePrice: salePrice,
        itemName: userItem.item.name,
        creditsReceived: salePrice
      }

    } catch (error) {
      console.error(`Error selling individual item ${userItemId}:`, error)
      return {
        success: false,
        error: 'Erro interno ao processar venda'
      }
    }
  }

  // MÉTODO DESABILITADO - Auto-sell agora é apenas manual
  // Processar todos os usuários com auto-sell habilitado
  async processAllUsers(): Promise<Record<string, AutoSellStats>> {
    // Método desabilitado pois auto-sell agora é apenas manual
    console.log('[AUTO-SELL] processAllUsers foi desabilitado - use apenas venda manual')
    return {}
  }
}

export const autoSellService = new AutoSellService()