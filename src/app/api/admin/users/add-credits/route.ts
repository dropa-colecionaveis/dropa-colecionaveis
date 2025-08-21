import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'admin@admin.com') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { userId, credits } = await req.json()

    if (!userId || !credits || credits <= 0) {
      return NextResponse.json(
        { error: 'Invalid userId or credits amount' },
        { status: 400 }
      )
    }

    // Update user credits and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: credits
          }
        }
      })

      await tx.transaction.create({
        data: {
          userId: userId,
          type: 'ADMIN_CREDIT_GRANT',
          amount: credits,
          description: `Admin granted ${credits} credits`
        }
      })

      return updatedUser
    })

    return NextResponse.json({
      success: true,
      newBalance: result.credits
    })
  } catch (error) {
    console.error('Add credits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}