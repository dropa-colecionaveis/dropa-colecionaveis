import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        createdAt: true,
        _count: {
          select: {
            packOpenings: true,
            userItems: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}