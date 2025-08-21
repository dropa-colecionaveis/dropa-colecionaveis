'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage('Token de verificação não encontrado na URL')
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message)
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        if (data.error?.includes('expirado')) {
          setStatus('expired')
        } else {
          setStatus('error')
        }
        setMessage(data.error || 'Erro na verificação')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Erro de comunicação. Tente novamente.')
    }
  }

  const handleResendVerification = async () => {
    if (!resendEmail) {
      alert('Por favor, digite seu email')
      return
    }

    setResending(true)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Novo email de verificação enviado!')
        setResendEmail('')
      } else {
        alert(data.error || 'Erro ao reenviar email')
      }
    } catch (error) {
      alert('Erro de comunicação. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-purple-500/30 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {status === 'loading' && '⏳'}
              {status === 'success' && '✅'}
              {status === 'error' && '❌'}
              {status === 'expired' && '⏰'}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {status === 'loading' && 'Verificando Email...'}
              {status === 'success' && 'Email Verificado!'}
              {status === 'error' && 'Erro na Verificação'}
              {status === 'expired' && 'Token Expirado'}
            </h1>
          </div>

          {/* Content */}
          <div className="text-center space-y-6">
            {status === 'loading' && (
              <div>
                <p className="text-gray-300">
                  Verificando seu email, aguarde...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-300 mx-auto mt-4"></div>
              </div>
            )}

            {status === 'success' && (
              <div>
                <p className="text-green-300 mb-4">{message}</p>
                <p className="text-gray-300 text-sm">
                  Redirecionando para o dashboard em alguns segundos...
                </p>
                <Link 
                  href="/dashboard" 
                  className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200"
                >
                  Ir para Dashboard
                </Link>
              </div>
            )}

            {(status === 'error' || status === 'expired') && (
              <div>
                <p className="text-red-300 mb-6">{message}</p>
                
                {/* Resend form */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
                  <h3 className="text-white font-semibold mb-4">
                    Reenviar Email de Verificação
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Digite seu email"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleResendVerification}
                      disabled={resending || !resendEmail}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {resending ? 'Enviando...' : 'Reenviar Email'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <div className="pt-6 border-t border-gray-600">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/auth/signin" 
                  className="text-purple-300 hover:text-purple-200 underline transition-colors"
                >
                  Fazer Login
                </Link>
                <Link 
                  href="/" 
                  className="text-gray-400 hover:text-white underline transition-colors"
                >
                  Página Inicial
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Não recebeu o email? Verifique sua caixa de spam ou lixo eletrônico.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}