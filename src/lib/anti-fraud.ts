import { prisma } from './prisma'
import { Rarity } from '@prisma/client'

interface AntiFreudConfig {
  // Preço - validações baseadas na raridade do item
  priceValidation: {
    maxPriceMultiplier: number // Ex: 10x o valor base máximo
    minPriceMultiplier: number // Ex: 0.1x o valor base mínimo
    suspiciousMultiplier: number // Ex: 5x marca como suspeito
  }
  
  // Limites de listagem
  listingLimits: {
    maxListingsPerDay: number
    maxActiveListings: number
    cooldownBetweenListings: number // em minutos
  }
  
  // Transações
  transactionLimits: {
    cooldownBetweenPurchases: number // em minutos
    maxPurchasesPerHour: number
    maxTransactionValue: number
  }
  
  // Detecção de atividade suspeita
  suspiciousActivity: {
    rapidListingThreshold: number // listagens em X minutos
    rapidPurchaseThreshold: number // compras em X minutos
    priceFluctuationThreshold: number // % de mudança de preço
  }
}

const DEFAULT_CONFIG: AntiFreudConfig = {
  priceValidation: {
    maxPriceMultiplier: 10,
    minPriceMultiplier: 0.1,
    suspiciousMultiplier: 5
  },
  listingLimits: {
    maxListingsPerDay: 50,
    maxActiveListings: 100,
    cooldownBetweenListings: 1 // 1 minuto entre listagens
  },
  transactionLimits: {
    cooldownBetweenPurchases: 2, // 2 minutos entre compras
    maxPurchasesPerHour: 20,
    maxTransactionValue: 10000 // 10k créditos máximo por transação
  },
  suspiciousActivity: {
    rapidListingThreshold: 10, // 10+ listagens em 5 minutos
    rapidPurchaseThreshold: 5, // 5+ compras em 10 minutos
    priceFluctuationThreshold: 200 // 200% de mudança é suspeito
  }
}

export class AntiFreudService {
  private config: AntiFreudConfig

  constructor(config: AntiFreudConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  // Validação de preço baseada na raridade do item
  async validatePrice(itemId: string, proposedPrice: number): Promise<{
    isValid: boolean
    isSuspicious: boolean
    message: string
    suggestedRange?: { min: number, max: number }
  }> {
    try {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { value: true, rarity: true, name: true }
      })

      if (!item) {
        return {
          isValid: false,
          isSuspicious: false,
          message: 'Item não encontrado'
        }
      }

      const baseValue = item.value
      const minPrice = Math.floor(baseValue * this.config.priceValidation.minPriceMultiplier)
      const maxPrice = Math.floor(baseValue * this.config.priceValidation.maxPriceMultiplier)
      const suspiciousPrice = Math.floor(baseValue * this.config.priceValidation.suspiciousMultiplier)

      const isValid = proposedPrice >= minPrice && proposedPrice <= maxPrice
      const isSuspicious = proposedPrice >= suspiciousPrice || proposedPrice <= (baseValue * 0.2)

      if (!isValid) {
        return {
          isValid: false,
          isSuspicious: isSuspicious,
          message: `Preço inválido. Deve estar entre ${minPrice} e ${maxPrice} créditos para itens ${item.rarity}`,
          suggestedRange: { min: minPrice, max: maxPrice }
        }
      }

      if (isSuspicious) {
        // Log atividade suspeita
        await this.logSuspiciousActivity('SUSPICIOUS_PRICING', {
          itemId,
          itemName: item.name,
          baseValue,
          proposedPrice,
          rarity: item.rarity
        })
      }

      return {
        isValid: true,
        isSuspicious: isSuspicious,
        message: isSuspicious ? 
          'Preço aceito mas marcado como suspeito para análise' : 
          'Preço válido',
        suggestedRange: { min: minPrice, max: maxPrice }
      }
    } catch (error) {
      console.error('Error validating price:', error)
      return {
        isValid: false,
        isSuspicious: false,
        message: 'Erro interno ao validar preço'
      }
    }
  }

  // Verifica limites de listagem do usuário
  async validateListingLimits(userId: string): Promise<{
    canList: boolean
    message: string
    waitTime?: number // em minutos
  }> {
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const cooldownTime = new Date(now.getTime() - this.config.listingLimits.cooldownBetweenListings * 60 * 1000)

      // Verifica listagens nas últimas 24 horas
      const dailyListings = await prisma.marketplaceListing.count({
        where: {
          userItem: { userId },
          createdAt: { gte: oneDayAgo }
        }
      })

      if (dailyListings >= this.config.listingLimits.maxListingsPerDay) {
        return {
          canList: false,
          message: `Limite diário de ${this.config.listingLimits.maxListingsPerDay} listagens atingido`
        }
      }

      // Verifica listagens ativas
      const activeListings = await prisma.marketplaceListing.count({
        where: {
          userItem: { userId },
          status: 'ACTIVE'
        }
      })

      if (activeListings >= this.config.listingLimits.maxActiveListings) {
        return {
          canList: false,
          message: `Limite de ${this.config.listingLimits.maxActiveListings} listagens ativas atingido`
        }
      }

      // Verifica cooldown
      const recentListing = await prisma.marketplaceListing.findFirst({
        where: {
          userItem: { userId },
          createdAt: { gte: cooldownTime }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (recentListing) {
        const waitTime = Math.ceil((cooldownTime.getTime() - recentListing.createdAt.getTime()) / (60 * 1000))
        return {
          canList: false,
          message: `Aguarde ${waitTime} minutos antes de criar outra listagem`,
          waitTime: waitTime
        }
      }

      return {
        canList: true,
        message: 'Usuário pode criar listagem'
      }
    } catch (error) {
      console.error('Error validating listing limits:', error)
      return {
        canList: false,
        message: 'Erro interno ao validar limites'
      }
    }
  }

  // Verifica cooldown e limites de transação
  async validateTransactionLimits(userId: string, transactionValue: number): Promise<{
    canPurchase: boolean
    message: string
    waitTime?: number // em minutos
  }> {
    try {
      if (transactionValue > this.config.transactionLimits.maxTransactionValue) {
        return {
          canPurchase: false,
          message: `Valor máximo por transação é ${this.config.transactionLimits.maxTransactionValue} créditos`
        }
      }

      const now = new Date()
      const cooldownTime = new Date(now.getTime() - this.config.transactionLimits.cooldownBetweenPurchases * 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Verifica cooldown entre compras
      const recentPurchase = await prisma.marketplaceTransaction.findFirst({
        where: {
          buyerId: userId,
          status: 'COMPLETED',
          createdAt: { gte: cooldownTime }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (recentPurchase) {
        const waitTime = Math.ceil((cooldownTime.getTime() - recentPurchase.createdAt.getTime()) / (60 * 1000))
        return {
          canPurchase: false,
          message: `Aguarde ${waitTime} minutos antes de fazer outra compra`,
          waitTime: waitTime
        }
      }

      // Verifica limite por hora
      const hourlyPurchases = await prisma.marketplaceTransaction.count({
        where: {
          buyerId: userId,
          status: 'COMPLETED',
          createdAt: { gte: oneHourAgo }
        }
      })

      if (hourlyPurchases >= this.config.transactionLimits.maxPurchasesPerHour) {
        return {
          canPurchase: false,
          message: `Limite de ${this.config.transactionLimits.maxPurchasesPerHour} compras por hora atingido`
        }
      }

      return {
        canPurchase: true,
        message: 'Usuário pode fazer compra'
      }
    } catch (error) {
      console.error('Error validating transaction limits:', error)
      return {
        canPurchase: false,
        message: 'Erro interno ao validar transação'
      }
    }
  }

  // Detecta atividade suspeita
  async detectSuspiciousActivity(userId: string): Promise<{
    isSuspicious: boolean
    reasons: string[]
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }> {
    try {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
      
      const reasons: string[] = []
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

      // Verifica listagens rápidas
      const rapidListings = await prisma.marketplaceListing.count({
        where: {
          userItem: { userId },
          createdAt: { gte: fiveMinutesAgo }
        }
      })

      if (rapidListings >= this.config.suspiciousActivity.rapidListingThreshold) {
        reasons.push(`${rapidListings} listagens em 5 minutos`)
        riskLevel = 'HIGH'
      }

      // Verifica compras rápidas
      const rapidPurchases = await prisma.marketplaceTransaction.count({
        where: {
          buyerId: userId,
          createdAt: { gte: tenMinutesAgo }
        }
      })

      if (rapidPurchases >= this.config.suspiciousActivity.rapidPurchaseThreshold) {
        reasons.push(`${rapidPurchases} compras em 10 minutos`)
        riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM'
      }

      // Verifica flutuações de preço suspeitas
      const userListings = await prisma.marketplaceListing.findMany({
        where: {
          userItem: { userId },
          createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) }, // última hora
          status: 'ACTIVE'
        },
        include: {
          userItem: {
            include: { item: true }
          }
        }
      })

      for (const listing of userListings) {
        const priceRatio = listing.price / listing.userItem.item.value
        if (priceRatio >= (this.config.suspiciousActivity.priceFluctuationThreshold / 100)) {
          reasons.push(`Preço ${Math.round(priceRatio * 100)}% acima do valor base`)
          riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM'
        }
      }

      const isSuspicious = reasons.length > 0

      if (isSuspicious) {
        await this.logSuspiciousActivity('SUSPICIOUS_BEHAVIOR', {
          userId,
          reasons,
          riskLevel,
          rapidListings,
          rapidPurchases
        })
      }

      return {
        isSuspicious,
        reasons,
        riskLevel
      }
    } catch (error) {
      console.error('Error detecting suspicious activity:', error)
      return {
        isSuspicious: false,
        reasons: [],
        riskLevel: 'LOW'
      }
    }
  }

  // Log atividades suspeitas (você pode expandir para usar uma tabela específica)
  private async logSuspiciousActivity(type: string, data: any): Promise<void> {
    try {
      console.warn(`[ANTI-FRAUD] ${type}:`, JSON.stringify(data, null, 2))
      
      // Aqui você poderia salvar em uma tabela de logs de segurança
      // await prisma.securityLog.create({ data: { type, data, timestamp: new Date() }})
    } catch (error) {
      console.error('Error logging suspicious activity:', error)
    }
  }

  // Função para obter histórico de preços de um item (para análise de mercado)
  async getItemPriceHistory(itemId: string, days: number = 30): Promise<{
    averagePrice: number
    medianPrice: number
    minPrice: number
    maxPrice: number
    priceHistory: Array<{ price: number, date: Date }>
  }> {
    try {
      const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      
      const completedTransactions = await prisma.marketplaceTransaction.findMany({
        where: {
          listing: {
            userItem: {
              item: { id: itemId }
            }
          },
          status: 'COMPLETED',
          createdAt: { gte: daysAgo }
        },
        include: {
          listing: true
        },
        orderBy: { createdAt: 'asc' }
      })

      if (completedTransactions.length === 0) {
        const item = await prisma.item.findUnique({
          where: { id: itemId },
          select: { value: true }
        })
        
        const baseValue = item?.value || 0
        return {
          averagePrice: baseValue,
          medianPrice: baseValue,
          minPrice: baseValue,
          maxPrice: baseValue,
          priceHistory: []
        }
      }

      const prices = completedTransactions.map(t => t.amount)
      const priceHistory = completedTransactions.map(t => ({
        price: t.amount,
        date: t.createdAt
      }))

      const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      const sortedPrices = [...prices].sort((a, b) => a - b)
      const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)]
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      return {
        averagePrice,
        medianPrice,
        minPrice,
        maxPrice,
        priceHistory
      }
    } catch (error) {
      console.error('Error getting item price history:', error)
      throw error
    }
  }
}

export const antiFraudService = new AntiFreudService()