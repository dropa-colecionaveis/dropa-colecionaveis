import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Apenas permitir em desenvolvimento ou se não há admins
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Setup not allowed in production' },
        { status: 403 }
      )
    }

    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { createInitialAdmin } = await import('@/lib/admin-auth')
    const admin = await createInitialAdmin(email, password, name)

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    )
  }
}