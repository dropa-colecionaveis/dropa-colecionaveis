import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(req)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: authResult.statusCode || 403 }
      )
    }

    // Buscar todos os itens únicos que foram adquiridos
    const uniqueItemsDetails = await prisma.userItem.findMany({
      where: {
        item: {
          isUnique: true,
          isActive: true
        }
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
            scarcityLevel: true,
            uniqueOwnerId: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        obtainedAt: 'desc'
      }
    })

    // Para cada item, buscar informações do pack opening
    const detailedResults = await Promise.all(
      uniqueItemsDetails.map(async (userItem) => {
        // Buscar o pack opening correspondente
        const packOpening = await prisma.packOpening.findFirst({
          where: {
            userId: userItem.userId,
            itemId: userItem.itemId,
            // Buscar por abertura próxima ao horário de obtenção (±1 minuto)
            createdAt: {
              gte: new Date(userItem.obtainedAt.getTime() - 60000), // 1 minuto antes
              lte: new Date(userItem.obtainedAt.getTime() + 60000)  // 1 minuto depois
            }
          },
          include: {
            pack: {
              select: {
                id: true,
                name: true,
                price: true,
                type: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return {
          userItemId: userItem.id,
          obtainedAt: userItem.obtainedAt,
          item: userItem.item,
          user: userItem.user,
          pack: packOpening?.pack || null,
          packOpeningId: packOpening?.id || null
        }
      })
    )

    // Agrupar por item para facilitar visualização
    const groupedByItem = detailedResults.reduce((acc, detail) => {
      const itemId = detail.item.id
      if (!acc[itemId]) {
        acc[itemId] = {
          item: detail.item,
          acquisitions: []
        }
      }
      acc[itemId].acquisitions.push({
        userItemId: detail.userItemId,
        obtainedAt: detail.obtainedAt,
        user: detail.user,
        pack: detail.pack,
        packOpeningId: detail.packOpeningId
      })
      return acc
    }, {} as Record<string, any>)

    // Estatísticas resumidas
    const stats = {
      totalUniqueItems: Object.keys(groupedByItem).length,
      totalAcquisitions: detailedResults.length,
      uniqueUsers: [...new Set(detailedResults.map(d => d.user.id))].length,
      packsSources: [...new Set(detailedResults.map(d => d.pack?.name).filter(Boolean))]
    }

    return NextResponse.json({
      success: true,
      data: {
        groupedByItem,
        allAcquisitions: detailedResults,
        stats
      }
    })

  } catch (error) {
    console.error('Unique items details fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
