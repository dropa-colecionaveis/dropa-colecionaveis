import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // 'purchases', 'sales', or 'all'

    const skip = (page - 1) * limit

    let where: any = {
      OR: [
        { buyerId: session.user.id },
        { sellerId: session.user.id }
      ]
    }

    if (type === 'purchases') {
      where = { buyerId: session.user.id }
    } else if (type === 'sales') {
      where = { sellerId: session.user.id }
    }

    const transactions = await prisma.marketplaceTransaction.findMany({
      where,
      include: {
        listing: {
          include: {
            userItem: {
              include: {
                item: {
                  include: {
                    collection: {
                      select: {
                        id: true,
                        name: true,
                        theme: {
                          select: {
                            name: true,
                            displayName: true,
                            emoji: true
                          }
                        },
                        customTheme: true
                      }
                    }
                  }
                },
                limitedEdition: {
                  select: {
                    id: true,
                    serialNumber: true,
                    item: {
                      select: {
                        maxEditions: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.marketplaceTransaction.count({ where })

    // Add transaction type for each transaction from user's perspective
    const transactionsWithType = transactions.map(transaction => ({
      ...transaction,
      transactionType: transaction.buyerId === session.user.id ? 'purchase' : 'sale'
    }))

    return NextResponse.json({
      transactions: transactionsWithType,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Marketplace transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}