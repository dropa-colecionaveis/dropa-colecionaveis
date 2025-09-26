import { Resend } from 'resend'

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

const getPasswordResetTemplate = (userEmail: string, resetToken: string) => {
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`
  
  return {
    subject: '🔑 Dropa! - Redefinir sua senha',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha - Dropa!</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; 
            padding: 20px; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); 
            padding: 40px 20px; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 28px;
            font-weight: bold;
          }
          .content { 
            padding: 40px 30px; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); 
            color: white; 
            text-decoration: none; 
            padding: 15px 30px; 
            border-radius: 10px; 
            font-weight: bold;
            margin: 20px 0;
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px 30px; 
            text-align: center; 
            color: #666;
            border-top: 1px solid #eee;
          }
          .emoji { font-size: 24px; }
          .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🔑</div>
            <h1>Redefinir Senha</h1>
            <p style="color: #E5E7EB; margin: 10px 0;">Dropa! - Colecionáveis Digitais</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1F2937;">Olá, Colecionador! 👋</h2>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta <strong>${userEmail}</strong>.</p>
            
            <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">
                🔐 Redefinir Minha Senha
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este link é válido por apenas <strong>30 minutos</strong></li>
                <li>Pode ser usado apenas uma vez</li>
                <li>Se você não solicitou esta alteração, ignore este email</li>
              </ul>
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 14px;">
              ${resetUrl}
            </p>
          </div>
          
          <div class="footer">
            <p><strong>🎮 Dropa! - Colecionáveis Digitais</strong></p>
            <p>Continue sua jornada épica de colecionamento!</p>
            <p style="font-size: 12px; margin-top: 15px;">
              Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      🔑 Dropa! - Redefinir Senha
      
      Olá, Colecionador!
      
      Recebemos uma solicitação para redefinir a senha da sua conta ${userEmail}.
      
      Se você fez esta solicitação, acesse o link abaixo para criar uma nova senha:
      ${resetUrl}
      
      ⚠️ IMPORTANTE:
      - Este link é válido por apenas 30 minutos
      - Pode ser usado apenas uma vez
      - Se você não solicitou esta alteração, ignore este email
      
      Continue sua jornada épica de colecionamento!
      
      🎮 Dropa! - Colecionáveis Digitais
    `
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    console.log('🔑 Iniciando envio de email de reset para:', email)
    console.log('🔑 API Key Resend configurada:', !!process.env.RESEND_API_KEY)
    console.log('🔑 Token de reset:', resetToken.substring(0, 8) + '...')
    
    const template = getPasswordResetTemplate(email, resetToken)
    
    const emailData = {
      from: 'Dropa! Colecionáveis <onboarding@resend.dev>',
      to: [email],
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: 'dropacolecionaveis@gmail.com',
    }
    
    // LIMITAÇÃO RESEND GRATUITO: Só pode enviar para email verificado
    const authorizedEmails = [
      'mateusreys@gmail.com', // Email da conta Resend
      'dropacolecionaveis@gmail.com' // Adicione outros emails autorizados aqui
    ]
    
    const originalEmail = email
    if (!authorizedEmails.includes(email)) {
      emailData.to = ['mateusreys@gmail.com'] // Redirecionar para email autorizado
      console.log(`🔄 RESEND LIMITAÇÃO: Email de ${originalEmail} redirecionado para ${emailData.to[0]}`)
      
      // Modificar template para incluir email original
      const modifiedTemplate = getPasswordResetTemplate(originalEmail, resetToken)
      emailData.subject = `[PARA: ${originalEmail}] ${modifiedTemplate.subject}`
      emailData.html = `
        <div style="background: #ff6b6b; color: white; padding: 15px; margin-bottom: 20px; border-radius: 10px; text-align: center;">
          <h3>⚠️ RESEND LIMITAÇÃO - PLANO GRATUITO</h3>
          <p><strong>Este email era para:</strong> ${originalEmail}</p>
          <p>Encaminhe manualmente ou configure domínio verificado</p>
        </div>
        ${modifiedTemplate.html}
      `
    }
    
    console.log('🔑 Dados do email:', {
      from: emailData.from,
      to: emailData.to,
      originalRecipient: originalEmail,
      subject: emailData.subject
    })
    
    const resendClient = getResend()
    const { data, error } = await resendClient.emails.send(emailData)

    if (error) {
      console.error('❌ Erro do Resend:', error)
      return { success: false, error }
    }

    console.log('✅ Email enviado com sucesso:', data)
    return { success: true, messageId: data?.id }
    
  } catch (error) {
    console.error('❌ Erro ao enviar email de reset:', error)
    return { success: false, error }
  }
}

export async function verifyEmailConfig() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY não configurada')
      return false
    }
    console.log('✅ Configuração de email válida')
    return true
  } catch (error) {
    console.error('❌ Erro na configuração de email:', error)
    return false
  }
}