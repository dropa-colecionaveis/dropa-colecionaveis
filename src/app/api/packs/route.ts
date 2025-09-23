import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { prisma } = await import('@/lib/prisma')

    const packs = await prisma.pack.findMany({
      where: {
        isActive: true
      },
      include: {
        probabilities: true
      },
      orderBy: {
        price: 'asc'
      }
    })

    // Definir ordem consistente das raridades
    const rarityOrder = ['COMUM', 'INCOMUM', 'RARO', 'EPICO', 'LENDARIO']
    
    // Ordenar probabilidades de cada pacote na ordem correta
    const packsWithOrderedProbabilities = packs.map(pack => ({
      ...pack,
      probabilities: pack.probabilities.sort((a, b) => {
        const indexA = rarityOrder.indexOf(a.rarity)
        const indexB = rarityOrder.indexOf(b.rarity)
        return indexA - indexB
      })
    }))

    return NextResponse.json(packsWithOrderedProbabilities)
  } catch (error) {
    console.error('Error fetching packs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}