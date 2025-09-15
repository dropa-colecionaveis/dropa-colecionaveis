import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o token existe e não expirou
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date()
        },
        usedAt: null
      },
      include: {
        user: true
      }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Usar transação para atualizar senha e marcar token como usado
    await prisma.$transaction([
      // Atualizar senha do usuário
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword
        }
      }),
      // Marcar token como usado
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date()
        }
      })
    ])

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso!' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}