import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const themes = await prisma.theme.findMany({
      include: {
        _count: {
          select: {
            collections: true
          }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(themes)
  } catch (error) {
    console.error('Themes fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, displayName, description, emoji, colorClass, borderClass } = body

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      )
    }

    // Check if theme name already exists
    const existingTheme = await prisma.theme.findUnique({
      where: { name: name.toLowerCase() }
    })

    if (existingTheme) {
      return NextResponse.json(
        { error: 'Theme name already exists' },
        { status: 400 }
      )
    }

    const theme = await prisma.theme.create({
      data: {
        name: name.toLowerCase(),
        displayName,
        description,
        emoji: emoji || '📚',
        colorClass: colorClass || 'from-gray-500/20 to-slate-500/20',
        borderClass: borderClass || 'border-gray-500/30',
        isActive: true,
        isSystem: false
      },
      include: {
        _count: {
          select: {
            collections: true
          }
        }
      }
    })

    return NextResponse.json(theme, { status: 201 })
  } catch (error) {
    console.error('Theme creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}