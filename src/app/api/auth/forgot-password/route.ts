import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Recebida solicitação de reset de senha')
    const { email } = await request.json()
    console.log('📧 Email solicitado:', email)

    if (!email) {
      console.log('❌ Email não fornecido')
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    console.log('🔍 Buscando usuário no banco...')
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', email)
      // Informar claramente que o email não existe
      return NextResponse.json(
        { error: 'Email não encontrado em nossa base de dados. Verifique se digitou corretamente ou cadastre-se primeiro.' },
        { status: 404 }
      )
    }

    console.log('✅ Usuário encontrado:', user.id)

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    // Invalidar tokens anteriores do usuário
    await prisma.passwordResetToken.updateMany({
      where: { 
        userId: user.id,
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    })

    // Criar novo token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
        ipAddress: request.ip || null,
        userAgent: request.headers.get('user-agent') || null
      }
    })

    // Enviar email
    console.log('Tentando enviar email de recuperação para:', email)
    const emailResult = await sendPasswordResetEmail(email, resetToken)

    if (emailResult.success) {
      console.log('Email de reset enviado:', emailResult.messageId)
      return NextResponse.json(
        { message: 'Email de recuperação enviado com sucesso!' },
        { status: 200 }
      )
    } else {
      console.error('Erro ao enviar email de reset:', emailResult.error)
      return NextResponse.json(
        { error: 'Falha ao enviar email de recuperação' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}