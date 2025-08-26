import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Fetching public stats...')
    
    // Buscar estatísticas reais do banco de dados
    const [
      totalUniqueItems,
      totalUsers,
      totalPackOpenings
    ] = await Promise.all([
      // Total de itens únicos no sistema
      prisma.item.count({
        where: { isActive: true }
      }).catch(() => 0), // Fallback to 0 if query fails
      
      // Total de usuários registrados
      prisma.user.count().catch(() => 0),
      
      // Total de pacotes abertos
      prisma.packOpening.count().catch(() => 0)
    ])

    console.log('Stats retrieved:', { totalUniqueItems, totalUsers, totalPackOpenings })

    // Formatar números com sufixos apropriados
    const formatNumber = (num: number): string => {
      if (num >= 1000) {
        return `${Math.floor(num / 1000)}k+`
      } else if (num >= 100) {
        return `${num}+`
      } else {
        return num.toString()
      }
    }

    const response = {
      uniqueItems: {
        count: totalUniqueItems,
        formatted: formatNumber(totalUniqueItems),
        label: totalUniqueItems === 1 ? 'Item Único' : 'Itens Únicos'
      },
      totalUsers: {
        count: totalUsers,
        formatted: formatNumber(totalUsers),
        label: totalUsers === 1 ? 'Jogador Ativo' : 'Jogadores Ativos'
      },
      packOpenings: {
        count: totalPackOpenings,
        formatted: formatNumber(totalPackOpenings),
        label: totalPackOpenings === 1 ? 'Pacote Aberto' : 'Pacotes Abertos'
      }
    }

    console.log('Returning response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching public stats:', error)
    
    // Em caso de erro, retornar valores padrão baixos
    const fallbackResponse = {
      uniqueItems: {
        count: 0,
        formatted: '0',
        label: 'Itens Únicos'
      },
      totalUsers: {
        count: 0,
        formatted: '0', 
        label: 'Jogadores Ativos'
      },
      packOpenings: {
        count: 0,
        formatted: '0',
        label: 'Pacotes Abertos'
      }
    }
    
    console.log('Returning fallback response:', fallbackResponse)
    return NextResponse.json(fallbackResponse, { status: 200 })
  }
}