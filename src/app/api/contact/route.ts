import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, category, subject, message, priority } = body

    // Validação básica
    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Mapear categorias para emojis e nomes amigáveis
    const categoryMap: { [key: string]: { icon: string; name: string } } = {
      'suporte-tecnico': { icon: '🔧', name: 'Suporte Técnico' },
      'pagamentos': { icon: '💳', name: 'Pagamentos' },
      'itens-perdidos': { icon: '📦', name: 'Itens Perdidos' },
      'sugestoes': { icon: '💡', name: 'Sugestões' },
      'parcerias': { icon: '🤝', name: 'Parcerias' },
      'outros': { icon: '❓', name: 'Outros' }
    }

    const categoryInfo = categoryMap[category] || { icon: '❓', name: 'Outros' }

    // Mapear prioridade
    const priorityMap: { [key: string]: { icon: string; name: string; color: string } } = {
      'baixa': { icon: '🟢', name: 'Baixa', color: '#10B981' },
      'normal': { icon: '🟡', name: 'Normal', color: '#F59E0B' },
      'alta': { icon: '🔴', name: 'Alta', color: '#EF4444' }
    }

    const priorityInfo = priorityMap[priority] || { icon: '🟡', name: 'Normal', color: '#F59E0B' }

    // Template do email para a equipe
    const emailToTeam = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4C1D95; margin: 0; font-size: 28px;">📧 Nova Mensagem de Contato</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #8B5CF6, #06B6D4); margin: 15px auto;"></div>
          </div>

          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
              ${categoryInfo.icon} ${categoryInfo.name}
              <span style="background: ${priorityInfo.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: auto;">
                ${priorityInfo.icon} ${priorityInfo.name}
              </span>
            </h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
              <div>
                <strong style="color: #6B7280;">Nome:</strong><br>
                <span style="color: #1F2937;">${name}</span>
              </div>
              <div>
                <strong style="color: #6B7280;">Email:</strong><br>
                <a href="mailto:${email}" style="color: #3B82F6; text-decoration: none;">${email}</a>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">📋 Assunto</h3>
            <p style="background: #EFF6FF; padding: 15px; border-radius: 8px; margin: 0; color: #1E40AF; font-weight: 500; border-left: 4px solid #3B82F6;">
              ${subject}
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">💬 Mensagem</h3>
            <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; line-height: 1.6; color: #374151;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background: linear-gradient(90deg, #8B5CF6, #06B6D4); padding: 20px; border-radius: 8px; text-align: center;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 14px;">
              ⏰ Mensagem recebida em: <strong>${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</strong>
            </p>
            <p style="color: white; margin: 0; font-size: 12px; opacity: 0.9;">
              💡 Responda diretamente para o email do usuário: ${email}
            </p>
          </div>

          <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; margin: 0; font-size: 12px;">
              📱 Enviado via Dropa! - Sistema de Colecionáveis Digitais
            </p>
          </div>
        </div>
      </div>
    `

    // Template de confirmação para o usuário
    const emailToUser = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4C1D95; margin: 0; font-size: 28px;">✅ Mensagem Recebida!</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #10B981, #06B6D4); margin: 15px auto;"></div>
          </div>

          <div style="background: linear-gradient(90deg, #10B981, #06B6D4); padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
            <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">Olá, ${name}!</h2>
            <p style="color: white; margin: 0; font-size: 16px; opacity: 0.95;">
              Sua mensagem foi enviada com sucesso e já está em nossa caixa de entrada!
            </p>
          </div>

          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10B981;">
            <h3 style="color: #065F46; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
              📋 Resumo da sua mensagem
            </h3>
            <div style="color: #047857;">
              <p style="margin: 8px 0;"><strong>Categoria:</strong> ${categoryInfo.icon} ${categoryInfo.name}</p>
              <p style="margin: 8px 0;"><strong>Prioridade:</strong> ${priorityInfo.icon} ${priorityInfo.name}</p>
              <p style="margin: 8px 0;"><strong>Assunto:</strong> ${subject}</p>
            </div>
          </div>

          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1E40AF; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
              ⏰ O que acontece agora?
            </h3>
            <div style="color: #1E3A8A; line-height: 1.6;">
              <p style="margin: 10px 0;">✓ Sua mensagem foi registrada em nosso sistema</p>
              <p style="margin: 10px 0;">✓ Nossa equipe será notificada imediatamente</p>
              <p style="margin: 10px 0;">✓ Responderemos em até <strong>24 horas</strong></p>
              ${priority === 'alta' ? '<p style="margin: 10px 0; color: #DC2626;"><strong>⚡ Prioridade ALTA: Responderemos ainda mais rápido!</strong></p>' : ''}
            </div>
          </div>

          <div style="background: linear-gradient(90deg, #8B5CF6, #06B6D4); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h3 style="color: white; margin: 0 0 15px 0;">💡 Enquanto isso...</h3>
            <p style="color: white; margin: 0 0 15px 0; opacity: 0.95;">
              Que tal dar uma olhada na nossa Central de Ajuda? Sua dúvida pode já ter resposta lá!
            </p>
            <a href="https://dropa-colecionaveis-staging.vercel.app/suporte" 
               style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; border: 2px solid rgba(255,255,255,0.3);">
              📚 Acessar Central de Ajuda
            </a>
          </div>

          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 25px;">
            <p style="color: #92400E; margin: 0; font-size: 14px;">
              <strong>📧 Importante:</strong> Fique de olho na sua caixa de entrada (e spam!) para nossa resposta.
              Se não receber resposta em 24h, entre em contato novamente.
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; margin: 0 0 10px 0; font-size: 14px;">
              Muito obrigado por usar a Dropa! 🚀
            </p>
            <p style="color: #6B7280; margin: 0; font-size: 12px;">
              📱 Sistema de Colecionáveis Digitais
            </p>
          </div>
        </div>
      </div>
    `

    // Enviar email para a equipe
    const emailToTeamResult = await resend.emails.send({
      from: 'Dropa! Contato <noreply@resend.dev>',
      to: 'dropacolecionaveis@gmail.com', // Email oficial da equipe
      subject: `[${priorityInfo.icon} ${priorityInfo.name}] ${categoryInfo.icon} ${categoryInfo.name}: ${subject}`,
      html: emailToTeam,
      replyTo: email // Para responder diretamente ao usuário
    })

    // Enviar confirmação para o usuário
    const emailToUserResult = await resend.emails.send({
      from: 'Dropa! Suporte <noreply@resend.dev>',
      to: email,
      subject: '✅ Mensagem recebida - Dropa! Colecionáveis',
      html: emailToUser
    })

    console.log('📧 Email enviado para equipe:', emailToTeamResult)
    console.log('📧 Confirmação enviada para usuário:', emailToUserResult)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Mensagem enviada com sucesso!',
        data: {
          teamEmailId: emailToTeamResult.data?.id,
          userEmailId: emailToUserResult.data?.id
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor. Tente novamente em alguns minutos.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}