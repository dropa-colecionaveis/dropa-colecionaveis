import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: Request,
  { params }: { params: { themeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, displayName, description, emoji, colorClass, borderClass, isActive } = body

    // Check if theme exists
    const existingTheme = await prisma.theme.findUnique({
      where: { id: params.themeId }
    })

    if (!existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with other themes
    if (name && name.toLowerCase() !== existingTheme.name) {
      const nameConflict = await prisma.theme.findUnique({
        where: { name: name.toLowerCase() }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Theme name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedTheme = await prisma.theme.update({
      where: { id: params.themeId },
      data: {
        ...(name && { name: name.toLowerCase() }),
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(emoji && { emoji }),
        ...(colorClass && { colorClass }),
        ...(borderClass && { borderClass }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      },
      include: {
        _count: {
          select: {
            collections: true
          }
        }
      }
    })

    return NextResponse.json(updatedTheme)
  } catch (error) {
    console.error('Theme update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { themeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Check if theme exists
    const theme = await prisma.theme.findUnique({
      where: { id: params.themeId },
      include: {
        _count: {
          select: {
            collections: true
          }
        }
      }
    })

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      )
    }

    // Check if it's a system theme
    if (theme.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system themes' },
        { status: 400 }
      )
    }

    // Check if theme has collections
    if (theme._count.collections > 0) {
      return NextResponse.json(
        { error: 'Cannot delete theme that is used by collections. Remove all collections first.' },
        { status: 400 }
      )
    }

    await prisma.theme.delete({
      where: { id: params.themeId }
    })

    return NextResponse.json({ message: 'Theme deleted successfully' })
  } catch (error) {
    console.error('Theme deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}