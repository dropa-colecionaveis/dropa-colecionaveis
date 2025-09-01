import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('🔴 LIVE STATS API - New endpoint')
  
  try {
    // Buscar dados em tempo real
    const [
      totalUniqueItems,
      claimedUniqueItems,
      totalUsers,
      totalPackOpenings,
      genesisItems,
      limitedEditionItems
    ] = await Promise.all([
      prisma.item.count({
        where: { 
          isActive: true,
          isUnique: true
        }
      }),
      prisma.item.count({
        where: { 
          isActive: true,
          isUnique: true,
          uniqueOwnerId: { not: null }
        }
      }),
      prisma.user.count(),
      prisma.packOpening.count(),
      prisma.item.count({
        where: {
          isActive: true,
          collection: {
            name: "Genesis - Primeira Era"
          }
        }
      }),
      prisma.item.count({
        where: {
          isActive: true,
          isLimitedEdition: true
        }
      })
    ])

    const availableUniqueItems = totalUniqueItems - claimedUniqueItems
    
    const formatNumber = (num: number): string => {
      if (num >= 1000) return `${Math.floor(num / 1000)}k+`
      else if (num >= 100) return `${num}+`
      else return num.toString()
    }

    const response = {
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
      timestamp: Date.now(),
      version: 'live'
    }

    console.log('🟢 Live stats response:', response)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('❌ Live stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch live stats' }, { status: 500 })
  }
}