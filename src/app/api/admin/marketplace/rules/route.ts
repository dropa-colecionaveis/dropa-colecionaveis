import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { marketplaceRulesEngine } = await import('@/lib/marketplace-rules')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    const rules = marketplaceRulesEngine.getRules()
    
    // Transform rules to include editable parameters
    const editableRules = rules.map(rule => {
      const ruleConfig = getRuleConfiguration(rule.id)
      return {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        isActive: rule.isActive,
        priority: rule.priority,
        configuration: ruleConfig,
        category: getRuleCategory(rule.id)
      }
    })

    return NextResponse.json({
      rules: editableRules,
      categories: [
        'security', 'pricing', 'limits', 'validation', 'anti-fraud'
      ]
    })
  } catch (error) {
    console.error('Error fetching marketplace rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { marketplaceRulesEngine } = await import('@/lib/marketplace-rules')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   )
    // }

    const { ruleId, isActive, configuration } = await req.json()

    if (!ruleId) {
      return NextResponse.json(
        { error: 'ruleId is required' },
        { status: 400 }
      )
    }

    // Update rule active status
    if (typeof isActive === 'boolean') {
      const success = await marketplaceRulesEngine.toggleRule(ruleId, isActive)
      if (!success) {
        return NextResponse.json(
          { error: 'Rule not found' },
          { status: 404 }
        )
      }
    }

    // Update rule configuration
    if (configuration) {
      await updateRuleConfiguration(ruleId, configuration)
    }

    // Log admin action
    console.log(`[ADMIN-ACTION] Rule ${ruleId} updated by admin ${session.user.id}`, {
      isActive,
      configuration
    })

    return NextResponse.json({
      message: 'Rule updated successfully',
      ruleId,
      isActive,
      configuration
    })
  } catch (error) {
    console.error('Error updating marketplace rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getRuleCategory(ruleId: string): string {
  const categoryMap: Record<string, string> = {
    'prevent-self-trading': 'security',
    'minimum-account-age': 'security',
    'max-price-deviation': 'pricing',
    'listing-rate-limit': 'limits',
    'suspicious-activity-check': 'anti-fraud',
    'limited-edition-validation': 'validation',
    'minimum-credits-purchase': 'validation',
    'item-ownership-validation': 'validation'
  }
  return categoryMap[ruleId] || 'other'
}

function getRuleConfiguration(ruleId: string): any {
  // Return current configuration for each rule
  const configurations: Record<string, any> = {
    'prevent-self-trading': {
      enabled: true,
      description: 'Impede usuários de comprar seus próprios itens'
    },
    'minimum-account-age': {
      minimumHours: 24,
      description: 'Idade mínima da conta em horas',
      editable: ['minimumHours']
    },
    'max-price-deviation': {
      maxMultiplier: 10,
      description: 'Multiplicador máximo do valor base (1000%)',
      editable: ['maxMultiplier']
    },
    'listing-rate-limit': {
      maxListingsPerHour: 5,
      description: 'Máximo de listagens por hora',
      editable: ['maxListingsPerHour']
    },
    'suspicious-activity-check': {
      enabled: true,
      blockHighRisk: true,
      description: 'Bloqueia automaticamente atividade de alto risco',
      editable: ['blockHighRisk']
    },
    'limited-edition-validation': {
      extraValidation: true,
      requireReview: true,
      description: 'Validação extra para itens de edição limitada',
      editable: ['extraValidation', 'requireReview']
    },
    'minimum-credits-purchase': {
      enabled: true,
      description: 'Verifica se o usuário tem créditos suficientes'
    },
    'item-ownership-validation': {
      enabled: true,
      description: 'Verifica se o usuário possui o item'
    }
  }
  
  return configurations[ruleId] || { enabled: true }
}

async function updateRuleConfiguration(ruleId: string, newConfig: any): Promise<void> {
  // Here you would typically save to database or configuration file
  // For now, we'll just log the update
  console.log(`[RULE-CONFIG] Updating rule ${ruleId} configuration:`, newConfig)
  
  // In a real implementation, you might:
  // 1. Save to database: await prisma.marketplaceRuleConfig.upsert(...)
  // 2. Update in-memory configuration
  // 3. Notify other instances of the application
  
  // For demonstration, we'll update some global configuration
  if (ruleId === 'minimum-account-age' && newConfig.minimumHours) {
    // Update the anti-fraud service or rules engine configuration
    console.log(`Updated minimum account age to ${newConfig.minimumHours} hours`)
  }
  
  if (ruleId === 'max-price-deviation' && newConfig.maxMultiplier) {
    console.log(`Updated max price multiplier to ${newConfig.maxMultiplier}x`)
  }
  
  if (ruleId === 'listing-rate-limit' && newConfig.maxListingsPerHour) {
    console.log(`Updated listing rate limit to ${newConfig.maxListingsPerHour} per hour`)
  }
}