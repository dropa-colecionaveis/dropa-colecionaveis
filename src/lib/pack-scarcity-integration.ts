import { prisma } from './prisma'
import { ScarcityManager, ScarcityLevel } from './scarcity-system'

export interface PackDropContext {
  packId: string
  userId: string
  packType: string
  timestamp: Date
}

export interface AvailableItem {
  id: string
  name: string
  rarity: string
  scarcityLevel: string
  isUnique: boolean
  isLimitedEdition: boolean
  isTemporal: boolean
  availabilityScore: number
  collectionId?: string
}

export class PackScarcityIntegration {
  /**
   * Obtém itens disponíveis para drop considerando escassez e temporalidade
   */
  static async getAvailableItemsForPack(context: PackDropContext): Promise<AvailableItem[]> {
    try {
      const { packId, userId, timestamp } = context

      // Obter probabilidades do pack
      const packProbabilities = await prisma.packProbability.findMany({
        where: { packId },
        include: { pack: true }
      })

      if (packProbabilities.length === 0) {
        throw new Error('Pack sem probabilidades configuradas')
      }

      const availableItems: AvailableItem[] = []

      for (const probability of packProbabilities) {
        // Buscar itens da raridade específica (consulta simplificada)
        const items = await prisma.item.findMany({
          where: {
            rarity: probability.rarity,
            isActive: true,
            // Filtros básicos de disponibilidade
            OR: [
              // Itens normais
              {
                isUnique: false,
                isLimitedEdition: false
              },
              // Itens únicos REALMENTE disponíveis (sem dono)
              {
                isUnique: true,
                uniqueOwnerId: null
              },
              // Edições limitadas com espaço disponível
              {
                isLimitedEdition: true,
                maxEditions: null // Sem limite
              },
              // Edições limitadas com contadores válidos
              {
                isLimitedEdition: true,
                maxEditions: { gt: 0 },
                currentEditions: { lt: 100000 } // Assumir que nunca passa de 100k
              }
            ]
          },
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                isTemporal: true,
                availableFrom: true,
                availableUntil: true,
                totalSupply: true,
                currentSupply: true,
                scarcityLevel: true
              }
            }
          }
        })

        // Filtrar por disponibilidade temporal e de coleção
        const filteredItems = await Promise.all(
          items.map(async (item) => {
            // Verificar disponibilidade temporal do item
            const itemAvailability = ScarcityManager.checkItemAvailability(item)
            if (!itemAvailability.isActive) {
              return null
            }

            // Verificar disponibilidade temporal da coleção (se houver)
            if (item.collection) {
              const collectionAvailability = ScarcityManager.checkCollectionAvailability(item.collection)
              if (!collectionAvailability.isActive) {
                return null
              }

              // Verificar se a coleção atingiu o suprimento máximo
              if (item.collection.totalSupply && item.collection.currentSupply >= item.collection.totalSupply) {
                return null
              }
            }

            // Calcular score de disponibilidade
            const scarcityInfo = ScarcityManager.calculateItemScarcity(item)
            const availabilityScore = this.calculateAvailabilityScore(item, scarcityInfo)

            return {
              id: item.id,
              name: item.name,
              rarity: item.rarity,
              scarcityLevel: item.scarcityLevel,
              isUnique: item.isUnique,
              isLimitedEdition: item.isLimitedEdition,
              isTemporal: item.isTemporal,
              availabilityScore,
              collectionId: item.collectionId
            } as AvailableItem
          })
        )

        // Filtrar nulls e adicionar à lista
        availableItems.push(...filteredItems.filter(item => item !== null) as AvailableItem[])
      }

      // CORREÇÃO: Retornar itens com seus scores para seleção ponderada
      // NÃO ordenar aqui - deixar para o sistema de seleção ponderada
      return availableItems

    } catch (error) {
      console.error('Error getting available items for pack:', error)
      throw error
    }
  }

  /**
   * Calcula score de disponibilidade baseado em escassez
   * MENOR score = MAIS DIFÍCIL de obter (mais escasso)
   * MAIOR score = MAIS FÁCIL de obter (menos escasso)
   */
  static calculateAvailabilityScore(item: any, scarcityInfo: any): number {
    let score = 100

    // CORREÇÃO: Aplicar reduções de chance conforme especificações originais
    const scarcityChanceReduction = {
      [ScarcityLevel.COMMON]: 1.0,      // 0% redução de chance
      [ScarcityLevel.UNCOMMON]: 0.9,    // -10% redução de chance
      [ScarcityLevel.RARE]: 0.8,        // -20% redução de chance
      [ScarcityLevel.LEGENDARY]: 0.6,   // -40% redução de chance
      [ScarcityLevel.UNIQUE]: 0.4       // -60% redução de chance
    }

    score *= scarcityChanceReduction[item.scarcityLevel as ScarcityLevel] || 1.0

    // Para itens únicos, aplicar apenas a redução base já configurada acima
    // (não aplicar redução adicional, pois já está na escala de escassez)

    // Reduzir score baseado na disponibilidade de edições limitadas
    if (item.isLimitedEdition && scarcityInfo.availabilityPercentage < 50) {
      const scarcityFactor = scarcityInfo.availabilityPercentage / 100
      score *= scarcityFactor // Quanto menos disponível, menor o score
    }

    // Reduzir score para itens temporais próximos do fim (mais valiosos)
    if (item.isTemporal && item.availableUntil) {
      const timeRemaining = new Date(item.availableUntil).getTime() - Date.now()
      const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24)

      if (daysRemaining < 7) {
        score *= 0.5 // 50% mais difícil para itens que expiram em breve
      }
    }

    return Math.max(0.1, score) // Garantir que sempre há uma chance mínima
  }

  /**
   * Seleciona um item baseado em probabilidade ponderada pelos scores de escassez
   * Itens com scores MAIORES têm MAIOR probabilidade de serem selecionados
   */
  static selectItemByScarcityWeight(items: AvailableItem[]): AvailableItem | null {
    if (items.length === 0) return null
    if (items.length === 1) return items[0]

    // Calcular soma total dos scores
    const totalScore = items.reduce((sum, item) => sum + item.availabilityScore, 0)

    if (totalScore === 0) {
      // Fallback para seleção aleatória se todos os scores forem 0
      return items[Math.floor(Math.random() * items.length)]
    }

    // Gerar número aleatório entre 0 e totalScore
    let randomValue = Math.random() * totalScore

    // Selecionar item baseado na probabilidade ponderada
    for (const item of items) {
      randomValue -= item.availabilityScore
      if (randomValue <= 0) {
        return item
      }
    }

    // Fallback para último item (não deveria acontecer)
    return items[items.length - 1]
  }

  /**
   * Processa o drop de um item, atualizando contadores de escassez
   */
  static async processItemDrop(itemId: string, userId: string, tx?: any): Promise<{ success: boolean, message?: string }> {
    try {
      // Se uma transação for fornecida, usa ela. Senão, cria uma nova.
      const executeInTransaction = async (transactionFn: (txClient: any) => Promise<any>) => {
        if (tx) {
          return transactionFn(tx)
        } else {
          return await prisma.$transaction(transactionFn)
        }
      }

      return await executeInTransaction(async (txClient) => {
        // Obter informações do item
        const item = await txClient.item.findUnique({
          where: { id: itemId },
          include: {
            collection: true
          }
        })

        if (!item) {
          return { success: false, message: 'Item não encontrado' }
        }

        // Verificar disponibilidade final
        const itemAvailability = ScarcityManager.checkItemAvailability(item)
        if (!itemAvailability.isActive) {
          return { success: false, message: 'Item não está mais disponível' }
        }

        // Para itens únicos
        if (item.isUnique) {
          if (item.uniqueOwnerId) {
            return { success: false, message: 'Item único já possui proprietário' }
          }

          // Verificação dupla: garantir que o usuário não possui este item único
          const existingUserItem = await txClient.userItem.findFirst({
            where: {
              userId,
              itemId
            }
          })

          if (existingUserItem) {
            return { success: false, message: 'Usuário já possui este item único' }
          }

          // Marcar como possuído (com verificação de condição para evitar condições de corrida)
          const updatedItem = await txClient.item.updateMany({
            where: {
              id: itemId,
              uniqueOwnerId: null // Só atualiza se ainda estiver disponível
            },
            data: { uniqueOwnerId: userId }
          })

          if (updatedItem.count === 0) {
            return { success: false, message: 'Item único não está mais disponível' }
          }

          // Criar entrada de UserItem
          await txClient.userItem.create({
            data: {
              userId,
              itemId
            }
          })

          return { success: true, message: 'Item único obtido com sucesso!' }
        }

        // Para edições limitadas
        if (item.isLimitedEdition) {
          if (item.maxEditions && item.currentEditions >= item.maxEditions) {
            return { success: false, message: 'Edições esgotadas' }
          }

          // Incrementar contador e obter novo serial
          const updatedItem = await txClient.item.update({
            where: { id: itemId },
            data: {
              currentEditions: {
                increment: 1
              }
            }
          })

          const serialNumber = updatedItem.currentEditions

          // Criar UserItem
          const userItem = await txClient.userItem.create({
            data: {
              userId,
              itemId
            }
          })

          // Criar registro de edição limitada
          await txClient.limitedEdition.create({
            data: {
              userItemId: userItem.id,
              serialNumber,
              mintedAt: new Date()
            }
          })

          return { success: true, message: `Edição #${serialNumber} obtida!` }
        }

        // Para itens normais
        await txClient.userItem.create({
          data: {
            userId,
            itemId
          }
        })

        // Atualizar suprimento da coleção se aplicável
        if (item.collection?.totalSupply) {
          await txClient.collection.update({
            where: { id: item.collectionId! },
            data: {
              currentSupply: {
                increment: 1
              }
            }
          })
        }

        return { success: true, message: 'Item obtido com sucesso!' }
      })

    } catch (error) {
      console.error('Error processing item drop:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  /**
   * Verifica se um usuário pode obter itens de uma coleção específica
   */
  static async canUserAccessCollection(userId: string, collectionId: string): Promise<{ canAccess: boolean, reason?: string }> {
    try {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId }
      })

      if (!collection) {
        return { canAccess: false, reason: 'Coleção não encontrada' }
      }

      // Verificar disponibilidade temporal
      const availability = ScarcityManager.checkCollectionAvailability(collection)
      if (!availability.isActive) {
        return { canAccess: false, reason: 'Coleção não está disponível no momento' }
      }

      // Verificar suprimento da coleção
      if (collection.totalSupply && collection.currentSupply >= collection.totalSupply) {
        return { canAccess: false, reason: 'Coleção esgotada' }
      }

      return { canAccess: true }

    } catch (error) {
      console.error('Error checking collection access:', error)
      return { canAccess: false, reason: 'Erro interno do servidor' }
    }
  }

  /**
   * Obtém estatísticas de escassez para o admin (com logs para debug)
   */
  static async getScarcityStats() {
    try {
      console.log('🔄 Iniciando consulta de estatísticas de escassez...')

      const stats = await Promise.all([
        // Itens únicos
        prisma.item.count({
          where: { isUnique: true, isActive: true }
        }),
        prisma.item.count({
          where: { isUnique: true, uniqueOwnerId: { not: null }, isActive: true }
        }),

        // Edições limitadas
        prisma.item.count({
          where: { isLimitedEdition: true, isActive: true }
        }),
        prisma.item.aggregate({
          where: { isLimitedEdition: true, isActive: true },
          _sum: {
            currentEditions: true,
            maxEditions: true
          }
        }),

        // Coleções temporais
        prisma.collection.count({
          where: { isTemporal: true, isActive: true }
        }),
        prisma.collection.count({
          where: {
            isTemporal: true,
            isActive: true,
            availableUntil: { gt: new Date() }
          }
        }),

        // Itens por nível de escassez
        prisma.item.groupBy({
          by: ['scarcityLevel'],
          where: { isActive: true },
          _count: true
        })
      ])

      // Log detalhado para debug
      console.log('📊 Estatísticas calculadas:')
      console.log(`  - Itens únicos total: ${stats[0]}`)
      console.log(`  - Itens únicos reivindicados: ${stats[1]}`)
      console.log(`  - Itens únicos disponíveis: ${stats[0] - stats[1]}`)
      console.log(`  - Edições limitadas total: ${stats[2]}`)
      console.log(`  - Edições mintadas: ${stats[3]._sum.currentEditions || 0}`)
      console.log(`  - Coleções temporais total: ${stats[4]}`)
      console.log(`  - Coleções temporais ativas: ${stats[5]}`)

      const result = {
        uniqueItems: {
          total: stats[0],
          claimed: stats[1],
          available: stats[0] - stats[1]
        },
        limitedEditions: {
          totalItems: stats[2],
          totalEditions: stats[3]._sum.currentEditions || 0,
          maxEditions: stats[3]._sum.maxEditions || 0
        },
        temporalCollections: {
          total: stats[4],
          active: stats[5]
        },
        itemsByScarcity: stats[6].reduce((acc: any, item: any) => {
          acc[item.scarcityLevel] = item._count
          return acc
        }, {}),
        _debug: {
          timestamp: new Date().toISOString(),
          rawStats: stats,
          scarcityBreakdown: stats[6]
        }
      }

      console.log('✅ Estatísticas processadas com sucesso')
      return result
    } catch (error) {
      console.error('❌ Error getting scarcity stats:', error)
      throw error
    }
  }
}

export default PackScarcityIntegration