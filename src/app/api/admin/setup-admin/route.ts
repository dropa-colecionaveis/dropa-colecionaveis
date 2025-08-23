import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const { prisma } = await import('@/lib/prisma')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { secret } = await req.json()
    if (secret !== 'make-me-admin-2025') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    // Promover usuário atual para ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    console.log('User promoted to admin:', updatedUser)

    return NextResponse.json({
      success: true,
      message: 'Você agora é um administrador!',
      user: updatedUser
    })

  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json({ 
      error: 'Failed to setup admin', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}