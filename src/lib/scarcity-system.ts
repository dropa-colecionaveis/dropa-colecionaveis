import { prisma } from './prisma'

export interface ScarcityInfo {
  level: ScarcityLevel
  currentSupply: number
  maxSupply: number | null
  availabilityPercentage: number
  isAvailable: boolean
  timeRemaining?: {
    days: number
    hours: number
    minutes: number
  }
}

export enum ScarcityLevel {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  UNIQUE = 'UNIQUE'
}

export interface TemporalAvailability {
  isActive: boolean
  availableFrom?: Date
  availableUntil?: Date
  timeRemaining?: {
    days: number
    hours: number
    minutes: number
    seconds: number
  }
}

export class ScarcityManager {
  /**
   * Verifica se uma coleção está disponível temporalmente
   */
  static checkCollectionAvailability(collection: any): TemporalAvailability {
    const now = new Date()
    
    if (!collection.isTemporal) {
      return { isActive: collection.isActive }
    }

    const availableFrom = collection.availableFrom ? new Date(collection.availableFrom) : null
    const availableUntil = collection.availableUntil ? new Date(collection.availableUntil) : null

    let isActive = collection.isActive

    // Verificar se ainda não chegou o momento de disponibilidade
    if (availableFrom && now < availableFrom) {
      isActive = false
    }

    // Verificar se já passou o prazo de disponibilidade
    if (availableUntil && now > availableUntil) {
      isActive = false
    }

    // Calcular tempo restante se há um prazo final
    let timeRemaining: TemporalAvailability['timeRemaining']
    if (availableUntil && now < availableUntil) {
      const diff = availableUntil.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      timeRemaining = { days, hours, minutes, seconds }
    }

    return {
      isActive,
      availableFrom: availableFrom || undefined,
      availableUntil: availableUntil || undefined,
      timeRemaining
    }
  }

  /**
   * Verifica se um item está disponível temporalmente
   */
  static checkItemAvailability(item: any): TemporalAvailability {
    const now = new Date()
    
    if (!item.isTemporal) {
      return { isActive: item.isActive }
    }

    const availableFrom = item.availableFrom ? new Date(item.availableFrom) : null
    const availableUntil = item.availableUntil ? new Date(item.availableUntil) : null

    let isActive = item.isActive

    if (availableFrom && now < availableFrom) {
      isActive = false
    }

    if (availableUntil && now > availableUntil) {
      isActive = false
    }

    let timeRemaining: TemporalAvailability['timeRemaining']
    if (availableUntil && now < availableUntil) {
      const diff = availableUntil.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      timeRemaining = { days, hours, minutes, seconds }
    }

    return {
      isActive,
      availableFrom: availableFrom || undefined,
      availableUntil: availableUntil || undefined,
      timeRemaining
    }
  }

  /**
   * Calcula informações de escassez de um item
   */
  static calculateItemScarcity(item: any): ScarcityInfo {
    const maxSupply = item.maxEditions || null
    const currentSupply = item.currentEditions || 0
    
    let availabilityPercentage = 100
    if (maxSupply && maxSupply > 0) {
      availabilityPercentage = Math.max(0, ((maxSupply - currentSupply) / maxSupply) * 100)
    }

    // Para itens únicos
    if (item.isUnique) {
      return {
        level: ScarcityLevel.UNIQUE,
        currentSupply: item.uniqueOwnerId ? 1 : 0,
        maxSupply: 1,
        availabilityPercentage: item.uniqueOwnerId ? 0 : 100,
        isAvailable: !item.uniqueOwnerId && item.isActive
      }
    }

    // Para itens com edições limitadas
    if (item.isLimitedEdition && maxSupply) {
      const isAvailable = currentSupply < maxSupply && item.isActive
      
      return {
        level: item.scarcityLevel || ScarcityLevel.COMMON,
        currentSupply,
        maxSupply,
        availabilityPercentage,
        isAvailable
      }
    }

    // Para itens comuns
    return {
      level: item.scarcityLevel || ScarcityLevel.COMMON,
      currentSupply,
      maxSupply,
      availabilityPercentage: 100,
      isAvailable: item.isActive
    }
  }

  /**
   * Calcula informações de escassez de uma coleção
   */
  static calculateCollectionScarcity(collection: any): ScarcityInfo {
    const maxSupply = collection.totalSupply || null
    const currentSupply = collection.currentSupply || 0
    
    let availabilityPercentage = 100
    if (maxSupply && maxSupply > 0) {
      availabilityPercentage = Math.max(0, ((maxSupply - currentSupply) / maxSupply) * 100)
    }

    return {
      level: collection.scarcityLevel || ScarcityLevel.COMMON,
      currentSupply,
      maxSupply,
      availabilityPercentage,
      isAvailable: collection.isActive && (maxSupply ? currentSupply < maxSupply : true)
    }
  }

  /**
   * Obtém a cor associada ao nível de escassez
   */
  static getScarcityColor(level: ScarcityLevel): string {
    const colors = {
      [ScarcityLevel.COMMON]: 'text-gray-400',
      [ScarcityLevel.UNCOMMON]: 'text-green-400',
      [ScarcityLevel.RARE]: 'text-blue-400',
      [ScarcityLevel.EPIC]: 'text-purple-400',
      [ScarcityLevel.LEGENDARY]: 'text-yellow-400',
      [ScarcityLevel.MYTHIC]: 'text-red-400',
      [ScarcityLevel.UNIQUE]: 'text-pink-400'
    }
    return colors[level] || colors[ScarcityLevel.COMMON]
  }

  /**
   * Obtém o nome em português do nível de escassez
   */
  static getScarcityName(level: ScarcityLevel): string {
    const names = {
      [ScarcityLevel.COMMON]: 'Comum',
      [ScarcityLevel.UNCOMMON]: 'Incomum',
      [ScarcityLevel.RARE]: 'Raro',
      [ScarcityLevel.EPIC]: 'Épico',
      [ScarcityLevel.LEGENDARY]: 'Lendário',
      [ScarcityLevel.MYTHIC]: 'Mítico',
      [ScarcityLevel.UNIQUE]: 'Único'
    }
    return names[level] || names[ScarcityLevel.COMMON]
  }

  /**
   * Obtém emoji representativo do nível de escassez
   */
  static getScarcityEmoji(level: ScarcityLevel): string {
    const emojis = {
      [ScarcityLevel.COMMON]: '⚪',
      [ScarcityLevel.UNCOMMON]: '🟢',
      [ScarcityLevel.RARE]: '🔵',
      [ScarcityLevel.EPIC]: '🟣',
      [ScarcityLevel.LEGENDARY]: '🟡',
      [ScarcityLevel.MYTHIC]: '🔴',
      [ScarcityLevel.UNIQUE]: '🌟'
    }
    return emojis[level] || emojis[ScarcityLevel.COMMON]
  }

  /**
   * Registra a obtenção de um item único
   */
  static async claimUniqueItem(itemId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verificar se o item existe e é único
        const item = await tx.item.findUnique({
          where: { id: itemId },
          select: { isUnique: true, uniqueOwnerId: true, isActive: true }
        })

        if (!item || !item.isUnique || !item.isActive || item.uniqueOwnerId) {
          throw new Error('Item não disponível para claim')
        }

        // Marcar o item como pertencente ao usuário
        await tx.item.update({
          where: { id: itemId },
          data: { uniqueOwnerId: userId }
        })

        // Criar entrada na tabela de itens do usuário
        await tx.userItem.create({
          data: {
            userId,
            itemId
          }
        })

        return true
      })

      return result
    } catch (error) {
      console.error('Error claiming unique item:', error)
      return false
    }
  }

  /**
   * Incrementa a edição atual de um item limitado e cria o registro numerado
   */
  static async mintLimitedEdition(itemId: string, userId: string): Promise<{ success: boolean, serialNumber?: number }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Obter informações do item
        const item = await tx.item.findUnique({
          where: { id: itemId },
          select: { 
            isLimitedEdition: true, 
            maxEditions: true, 
            currentEditions: true,
            isActive: true
          }
        })

        if (!item || !item.isLimitedEdition || !item.isActive) {
          throw new Error('Item não é edição limitada ou não está ativo')
        }

        if (item.maxEditions && item.currentEditions >= item.maxEditions) {
          throw new Error('Edições esgotadas')
        }

        // Incrementar contador de edições
        const newEditionNumber = item.currentEditions + 1
        
        await tx.item.update({
          where: { id: itemId },
          data: { currentEditions: newEditionNumber }
        })

        // Criar registro da edição limitada
        const limitedEdition = await tx.limitedEdition.create({
          data: {
            itemId,
            serialNumber: newEditionNumber
          }
        })

        // Criar entrada na tabela de itens do usuário
        await tx.userItem.create({
          data: {
            userId,
            itemId,
            limitedEditionId: limitedEdition.id
          }
        })

        return { success: true, serialNumber: newEditionNumber }
      })

      return result
    } catch (error) {
      console.error('Error minting limited edition:', error)
      return { success: false }
    }
  }

  /**
   * Formata informações de tempo restante
   */
  static formatTimeRemaining(timeRemaining?: { days: number, hours: number, minutes: number, seconds?: number }): string {
    if (!timeRemaining) return ''

    const { days, hours, minutes, seconds } = timeRemaining

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds || 0}s`
    } else {
      return `${seconds || 0}s`
    }
  }
}

export default ScarcityManager