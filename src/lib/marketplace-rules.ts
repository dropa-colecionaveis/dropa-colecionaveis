import { prisma } from './prisma'
import { Rarity, ListingStatus } from '@prisma/client'
import { antiFraudService } from './anti-fraud'

export interface MarketplaceRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  condition: (context: MarketplaceRuleContext) => Promise<boolean>
  action: (context: MarketplaceRuleContext) => Promise<MarketplaceRuleResult>
}

export interface MarketplaceRuleContext {
  userId: string
  listingId?: string
  itemId?: string
  transactionId?: string
  price?: number
  action: 'CREATE_LISTING' | 'PURCHASE_ITEM' | 'UPDATE_LISTING' | 'CANCEL_LISTING'
  metadata?: any
}

export interface MarketplaceRuleResult {
  allowed: boolean
  message: string
  warning?: string
  requiresReview?: boolean
  blockDuration?: number // minutes
  metadata?: any
}

export class MarketplaceRulesEngine {
  private rules: MarketplaceRule[] = []

  constructor() {
    this.initializeDefaultRules()
  }

  private initializeDefaultRules() {
    this.rules = [
      // Rule 1: Prevent self-trading
      {
        id: 'prevent-self-trading',
        name: 'Prevent Self-Trading',
        description: 'Users cannot purchase their own listed items',
        isActive: true,
        priority: 1,
        condition: async (context) => {
          if (context.action !== 'PURCHASE_ITEM' || !context.listingId) return false
          
          const listing = await prisma.marketplaceListing.findUnique({
            where: { id: context.listingId },
            select: { sellerId: true }
          })
          
          return listing?.sellerId === context.userId
        },
        action: async () => ({
          allowed: false,
          message: 'Você não pode comprar seus próprios itens'
        })
      },

      // Rule 2: Minimum account age for trading
      {
        id: 'minimum-account-age',
        name: 'Minimum Account Age',
        description: 'Users must have account for at least 24 hours to trade',
        isActive: false,
        priority: 2,
        condition: async (context) => {
          if (!['CREATE_LISTING', 'PURCHASE_ITEM'].includes(context.action)) return false
          
          const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: { createdAt: true }
          })
          
          if (!user) return false
          
          const accountAgeHours = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60)
          return accountAgeHours < 24
        },
        action: async (context) => {
          const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: { createdAt: true }
          })
          
          const hoursRemaining = Math.ceil(24 - (Date.now() - user!.createdAt.getTime()) / (1000 * 60 * 60))
          
          return {
            allowed: false,
            message: `Contas novas precisam aguardar ${hoursRemaining} horas antes de negociar no marketplace`
          }
        }
      },

      // Rule 3: Maximum price deviation
      {
        id: 'max-price-deviation',
        name: 'Maximum Price Deviation',
        description: 'Prices cannot exceed 1000% of base item value',
        isActive: true,
        priority: 3,
        condition: async (context) => {
          if (context.action !== 'CREATE_LISTING' || !context.itemId || !context.price) return false
          
          const item = await prisma.item.findUnique({
            where: { id: context.itemId },
            select: { value: true }
          })
          
          if (!item) return false
          
          const priceRatio = context.price / item.value
          return priceRatio > 10 // 1000%
        },
        action: async (context) => {
          const item = await prisma.item.findUnique({
            where: { id: context.itemId! },
            select: { value: true }
          })
          
          return {
            allowed: false,
            message: `Preço não pode exceder 10x o valor base do item (${item!.value * 10} créditos)`
          }
        }
      },

      // Rule 4: Rate limiting for listings
      {
        id: 'listing-rate-limit',
        name: 'Listing Rate Limit',
        description: 'Users cannot create more than 5 listings per hour',
        isActive: false,
        priority: 4,
        condition: async (context) => {
          if (context.action !== 'CREATE_LISTING') return false
          
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
          const recentListings = await prisma.marketplaceListing.count({
            where: {
              sellerId: context.userId,
              createdAt: { gte: oneHourAgo }
            }
          })
          
          return recentListings >= 5
        },
        action: async () => ({
          allowed: false,
          message: 'Limite de 5 listagens por hora atingido. Tente novamente mais tarde.'
        })
      },

      // Rule 5: Suspicious activity detection
      {
        id: 'suspicious-activity-check',
        name: 'Suspicious Activity Check',
        description: 'Block actions from users with suspicious activity',
        isActive: true,
        priority: 5,
        condition: async (context) => {
          const suspiciousActivity = await antiFraudService.detectSuspiciousActivity(context.userId)
          return suspiciousActivity.isSuspicious && suspiciousActivity.riskLevel === 'HIGH'
        },
        action: async (context) => {
          const suspiciousActivity = await antiFraudService.detectSuspiciousActivity(context.userId)
          
          return {
            allowed: false,
            message: 'Atividade suspeita detectada. Sua conta foi temporariamente restringida.',
            blockDuration: 60, // 1 hour
            metadata: {
              reasons: suspiciousActivity.reasons,
              riskLevel: suspiciousActivity.riskLevel
            }
          }
        }
      },

      // Rule 6: Limited edition item validation
      {
        id: 'limited-edition-validation',
        name: 'Limited Edition Validation',
        description: 'Apply special rules for limited edition items',
        isActive: true,
        priority: 6,
        condition: async (context) => {
          if (!context.itemId) return false
          
          const item = await prisma.item.findUnique({
            where: { id: context.itemId },
            select: { isLimitedEdition: true }
          })
          
          return item?.isLimitedEdition === true
        },
        action: async (context) => {
          const priceValidation = await antiFraudService.validatePrice(context.itemId!, context.price || 0)
          
          if (!priceValidation.isValid) {
            return {
              allowed: false,
              message: `Item de edição limitada: ${priceValidation.message}`
            }
          }
          
          return {
            allowed: true,
            message: 'Item de edição limitada validado',
            warning: 'Este é um item de edição limitada. Preço pode ser volátil.',
            requiresReview: priceValidation.isSuspicious
          }
        }
      },

      // Rule 7: Minimum credits requirement
      {
        id: 'minimum-credits-purchase',
        name: 'Minimum Credits Purchase',
        description: 'Users must have sufficient credits to make purchases',
        isActive: true,
        priority: 7,
        condition: async (context) => {
          if (context.action !== 'PURCHASE_ITEM' || !context.listingId) return false
          
          const [user, listing] = await Promise.all([
            prisma.user.findUnique({
              where: { id: context.userId },
              select: { credits: true }
            }),
            prisma.marketplaceListing.findUnique({
              where: { id: context.listingId },
              select: { price: true }
            })
          ])
          
          if (!user || !listing) return false
          
          return user.credits < listing.price
        },
        action: async (context) => {
          const [user, listing] = await Promise.all([
            prisma.user.findUnique({
              where: { id: context.userId },
              select: { credits: true }
            }),
            prisma.marketplaceListing.findUnique({
              where: { id: context.listingId },
              select: { price: true }
            })
          ])
          
          const deficit = (listing?.price || 0) - (user?.credits || 0)
          
          return {
            allowed: false,
            message: `Créditos insuficientes. Você precisa de mais ${deficit} créditos para fazer esta compra.`
          }
        }
      },

      // Rule 8: Item ownership validation
      {
        id: 'item-ownership-validation',
        name: 'Item Ownership Validation',
        description: 'Users can only list items they own',
        isActive: true,
        priority: 8,
        condition: async (context) => {
          if (context.action !== 'CREATE_LISTING' || !context.metadata?.userItemId) return false
          
          const userItem = await prisma.userItem.findFirst({
            where: {
              id: context.metadata.userItemId,
              userId: context.userId
            }
          })
          
          return !userItem
        },
        action: async () => ({
          allowed: false,
          message: 'Você não possui este item ou ele não foi encontrado'
        })
      }
    ]
  }

  async evaluateRules(context: MarketplaceRuleContext): Promise<MarketplaceRuleResult> {
    // Sort rules by priority
    const activeRules = this.rules
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority)

    for (const rule of activeRules) {
      try {
        const conditionMet = await rule.condition(context)
        
        if (conditionMet) {
          console.log(`[MARKETPLACE-RULE] Rule triggered: ${rule.name}`)
          const result = await rule.action(context)
          
          // Log rule execution
          console.log(`[MARKETPLACE-RULE] ${rule.name} result:`, result)
          
          return {
            ...result,
            metadata: {
              ...result.metadata,
              ruleId: rule.id,
              ruleName: rule.name
            }
          }
        }
      } catch (error) {
        console.error(`[MARKETPLACE-RULE] Error evaluating rule ${rule.name}:`, error)
        // Continue to next rule on error
      }
    }

    // No rules were triggered
    return {
      allowed: true,
      message: 'All marketplace rules passed'
    }
  }

  async addRule(rule: MarketplaceRule): Promise<void> {
    // Check if rule with same ID already exists
    const existingRuleIndex = this.rules.findIndex(r => r.id === rule.id)
    
    if (existingRuleIndex >= 0) {
      this.rules[existingRuleIndex] = rule
    } else {
      this.rules.push(rule)
    }
  }

  async removeRule(ruleId: string): Promise<boolean> {
    const initialLength = this.rules.length
    this.rules = this.rules.filter(rule => rule.id !== ruleId)
    return this.rules.length < initialLength
  }

  async toggleRule(ruleId: string, isActive: boolean): Promise<boolean> {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      rule.isActive = isActive
      return true
    }
    return false
  }

  getRules(): MarketplaceRule[] {
    return this.rules.map(rule => ({
      ...rule,
      // Don't expose the actual functions for security
      condition: rule.condition.toString(),
      action: rule.action.toString()
    })) as any
  }

  async validateListingCreation(userId: string, userItemId: string, price: number, description?: string): Promise<MarketplaceRuleResult> {
    // Get item details
    const userItem = await prisma.userItem.findUnique({
      where: { id: userItemId },
      include: { item: true }
    })

    if (!userItem) {
      return {
        allowed: false,
        message: 'Item não encontrado'
      }
    }

    const context: MarketplaceRuleContext = {
      userId,
      itemId: userItem.item.id,
      price,
      action: 'CREATE_LISTING',
      metadata: {
        userItemId,
        description,
        itemValue: userItem.item.value,
        rarity: userItem.item.rarity
      }
    }

    return await this.evaluateRules(context)
  }

  async validatePurchase(userId: string, listingId: string): Promise<MarketplaceRuleResult> {
    const context: MarketplaceRuleContext = {
      userId,
      listingId,
      action: 'PURCHASE_ITEM'
    }

    return await this.evaluateRules(context)
  }
}

export const marketplaceRulesEngine = new MarketplaceRulesEngine()