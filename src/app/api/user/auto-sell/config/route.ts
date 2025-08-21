import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autoSellService } from '@/lib/auto-sell'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const config = await autoSellService.getAutoSellConfig(session.user.id)
    
    // Se não existe config, retornar valores padrão (percentuais fixos não são enviados)
    if (!config) {
      return NextResponse.json({
        sellCommon: true,
        sellUncommon: true,
        sellRare: false,
        sellEpic: false,
        sellLegendary: false,
        keepQuantity: 1,
        sellLimitedEd: false
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Auto-sell config fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const configData = await req.json()

    // Garantir que keepQuantity nunca seja menor que 1 para proteger coleções
    if (configData.keepQuantity !== undefined && configData.keepQuantity < 1) {
      configData.keepQuantity = 1
    }

    // Validações básicas (apenas proteção de coleções)
    const validations = [
      { field: 'keepQuantity', min: 1, max: 10 } // Mínimo 1, máximo 10 para proteger coleções
    ]

    for (const validation of validations) {
      const value = configData[validation.field]
      if (value !== undefined && (value < validation.min || value > validation.max)) {
        return NextResponse.json(
          { error: `${validation.field} must be between ${validation.min} and ${validation.max}` },
          { status: 400 }
        )
      }
    }

    // Validar que pelo menos uma raridade está selecionada
    const hasRaritySelected = configData.sellCommon || configData.sellUncommon || 
                             configData.sellRare || configData.sellEpic || 
                             configData.sellLegendary

    if (!hasRaritySelected) {
      return NextResponse.json(
        { error: 'At least one rarity must be selected for batch selling' },
        { status: 400 }
      )
    }

    const updatedConfig = await autoSellService.updateAutoSellConfig(session.user.id, configData)

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Auto-sell config update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}