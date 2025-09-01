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
        // Buscar itens da raridade específica
        const items = await prisma.item.findMany({
          where: {
            rarity: probability.rarity,
            isActive: true,
            // Filtros de escassez
            AND: [
              // Item único já possuído
              {
                OR: [
                  { isUnique: false },
                  { 
                    isUnique: true,
                    uniqueOwnerId: null 
                  }
                ]
              },
              // Edições limitadas esgotadas
              {
                OR: [
                  { isLimitedEdition: false },
                  {
                    AND: [
                      { isLimitedEdition: true },
                      {
                        OR: [
                          { maxEditions: null },
                          {
                            currentEditions: {
                              lt: prisma.item.fields.maxEditions
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
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

      // Ordenar por score de disponibilidade (mais disponíveis primeiro para drops normais)
      return availableItems.sort((a, b) => b.availabilityScore - a.availabilityScore)

    } catch (error) {
      console.error('Error getting available items for pack:', error)
      throw error
    }
  }

  /**
   * Calcula score de disponibilidade baseado em escassez
   */
  private static calculateAvailabilityScore(item: any, scarcityInfo: any): number {
    let score = 100

    // Reduzir score baseado no nível de escassez
    const scarcityPenalty = {
      [ScarcityLevel.COMMON]: 0,
      [ScarcityLevel.UNCOMMON]: -10,
      [ScarcityLevel.RARE]: -20,
      [ScarcityLevel.EPIC]: -30,
      [ScarcityLevel.LEGENDARY]: -40,
      [ScarcityLevel.MYTHIC]: -50,
      [ScarcityLevel.UNIQUE]: -60
    }

    score += scarcityPenalty[item.scarcityLevel as ScarcityLevel] || 0

    // Penalizar itens únicos e limitados
    if (item.isUnique) {
      score -= 70
    }

    if (item.isLimitedEdition && scarcityInfo.availabilityPercentage < 50) {
      score -= (50 - scarcityInfo.availabilityPercentage)
    }

    // Bonificar itens temporais próximos do fim
    if (item.isTemporal && item.availableUntil) {
      const timeRemaining = new Date(item.availableUntil).getTime() - Date.now()
      const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24)
      
      if (daysRemaining < 7) {
        score += 20 // Bonificar itens que expiram em breve
      }
    }

    return Math.max(0, score)
  }

  /**
   * Processa o drop de um item, atualizando contadores de escassez
   */
  static async processItemDrop(itemId: string, userId: string): Promise<{ success: boolean, message?: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Obter informações do item
        const item = await tx.item.findUnique({
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

          // Marcar como possuído
          await tx.item.update({
            where: { id: itemId },
            data: { uniqueOwnerId: userId }
          })

          // Criar entrada de UserItem
          await tx.userItem.create({
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

          // Usar o sistema existente de mintagem
          const mintResult = await ScarcityManager.mintLimitedEdition(itemId, userId)
          
          if (!mintResult.success) {
            return { success: false, message: 'Erro ao obter edição limitada' }
          }

          return { success: true, message: `Edição #${mintResult.serialNumber} obtida!` }
        }

        // Para itens normais
        await tx.userItem.create({
          data: {
            userId,
            itemId
          }
        })

        // Atualizar suprimento da coleção se aplicável
        if (item.collection?.totalSupply) {
          await tx.collection.update({
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
   * Obtém estatísticas de escassez para o admin
   */
  static async getScarcityStats() {
    try {
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

      return {
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
        }, {})
      }
    } catch (error) {
      console.error('Error getting scarcity stats:', error)
      throw error
    }
  }
}

export default PackScarcityIntegration