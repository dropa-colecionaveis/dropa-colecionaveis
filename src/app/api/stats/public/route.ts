import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timestamp = searchParams.get('t') || Date.now()
  console.log('🔄 Fetching fresh public stats (v3) - timestamp:', timestamp)
  
  try {
    // Buscar estatísticas reais do banco de dados com queries detalhadas
    const statsData = await Promise.all([
      // Total de itens no sistema (todos os itens ativos)
      prisma.item.count({
        where: { 
          isActive: true
        }
      }),

      // Itens únicos totais
      prisma.item.count({
        where: { 
          isActive: true,
          isUnique: true
        }
      }),

      // Itens únicos já reivindicados (claimed)
      prisma.item.count({
        where: { 
          isActive: true,
          isUnique: true,
          uniqueOwnerId: { not: null }
        }
      }),
      
      // Total de usuários registrados
      prisma.user.count(),
      
      // Total de pacotes abertos (sempre atualizado)
      prisma.packOpening.count(),

      // Itens da Genesis Collection
      prisma.item.count({
        where: {
          isActive: true,
          collection: {
            name: "Genesis - Primeira Era"
          }
        }
      }),

      // Itens de edições limitadas
      prisma.item.count({
        where: {
          isActive: true,
          isLimitedEdition: true
        }
      })
    ])

    const [
      totalItems,
      totalUniqueItems,
      claimedUniqueItems, 
      totalUsers,
      totalPackOpenings,
      genesisItems,
      limitedEditionItems
    ] = statsData

    console.log('📊 Raw stats:', {
      totalItems,
      totalUniqueItems,
      claimedUniqueItems,
      totalUsers,
      totalPackOpenings,
      genesisItems,
      limitedEditionItems
    })

    // Formatar números com sufixos
    const formatNumber = (num: number): string => {
      if (num >= 1000) {
        return `${Math.floor(num / 1000)}k+`
      } else if (num >= 100) {
        return `${num}+`
      } else {
        return num.toString()
      }
    }

    // Calcular itens únicos disponíveis
    const availableUniqueItems = totalUniqueItems - claimedUniqueItems

    const response = {
      totalItems: {
        count: totalItems,
        formatted: formatNumber(totalItems),
        label: totalItems === 1 ? 'Item Cadastrado' : 'Itens Cadastrados'
      },
      uniqueItems: {
        count: availableUniqueItems,
        formatted: formatNumber(availableUniqueItems),
        label: availableUniqueItems === 1 ? 'Item Único Disponível' : 'Itens Únicos Disponíveis',
        total: totalUniqueItems,
        claimed: claimedUniqueItems
      },
      totalUsers: {
        count: totalUsers,
        formatted: formatNumber(totalUsers),
        label: totalUsers === 1 ? 'Colecionador' : 'Colecionadores'
      },
      packOpenings: {
        count: totalPackOpenings,
        formatted: formatNumber(totalPackOpenings),
        label: totalPackOpenings === 1 ? 'Pack Aberto' : 'Packs Abertos'
      },
      genesis: {
        totalItems: genesisItems,
        uniqueItems: totalUniqueItems,
        limitedEditions: limitedEditionItems
      },
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ Sending response:', response)

    // Headers para evitar cache com timestamp
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-Timestamp': timestamp.toString()
      }
    })

  } catch (error) {
    console.error('❌ Error fetching public stats:', error)
    
    // Fallback response
    const fallbackResponse = {
      totalItems: {
        count: 100,
        formatted: '100+',
        label: 'Itens Cadastrados'
      },
      uniqueItems: {
        count: 5,
        formatted: '5',
        label: 'Itens Únicos Disponíveis',
        total: 5,
        claimed: 0
      },
      totalUsers: {
        count: 0,
        formatted: '0', 
        label: 'Colecionadores'
      },
      packOpenings: {
        count: 0,
        formatted: '0',
        label: 'Packs Abertos'
      },
      genesis: {
        totalItems: 100,
        uniqueItems: 5,
        limitedEditions: 5
      },
      lastUpdated: new Date().toISOString(),
      error: true
    }
    
    return NextResponse.json(fallbackResponse, { status: 200 })
  }
}