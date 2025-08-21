import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ListingStatus } from '@prisma/client'

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
    const status = searchParams.get('status') as ListingStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    let where: any = {
      sellerId: session.user.id
    }

    if (status) {
      where.status = status
    }

    const listings = await prisma.marketplaceListing.findMany({
      where,
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
                    maxEditions: true,
                    currentEditions: true
                  }
                }
              }
            }
          }
        },
        transactions: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.marketplaceListing.count({ where })

    // Calculate some statistics
    const stats = await prisma.marketplaceListing.groupBy({
      by: ['status'],
      where: {
        sellerId: session.user.id
      },
      _count: {
        status: true
      }
    })

    const totalEarnings = await prisma.marketplaceTransaction.aggregate({
      where: {
        sellerId: session.user.id,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true,
        marketplaceFee: true
      }
    })

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        statusBreakdown: stats,
        totalEarnings: (totalEarnings._sum.amount || 0) - (totalEarnings._sum.marketplaceFee || 0),
        totalSales: await prisma.marketplaceTransaction.count({
          where: {
            sellerId: session.user.id,
            status: 'COMPLETED'
          }
        })
      }
    })
  } catch (error) {
    console.error('User marketplace listings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}