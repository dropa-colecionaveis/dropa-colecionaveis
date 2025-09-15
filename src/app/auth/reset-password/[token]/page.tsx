'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)
  
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  useEffect(() => {
    // Verificar se o token é válido ao carregar a página
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          setValidToken(true)
        } else {
          setValidToken(false)
          setError('Link inválido ou expirado')
        }
      } catch (error) {
        setValidToken(false)
        setError('Erro ao verificar token')
      }
    }

    if (token) {
      verifyToken()
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Senha redefinida com sucesso! Redirecionando...')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setError(data.error || 'Erro ao redefinir senha')
      }
    } catch (error) {
      setError('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Verificando link...</p>
        </div>
      </div>
    )
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-white mb-4">Link Inválido</h1>
              <p className="text-gray-300 mb-6">Este link de recuperação é inválido ou já expirou.</p>
              <Link 
                href="/auth/forgot-password"
                className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl px-6 py-3 text-white font-semibold transition-all duration-300"
              >
                Solicitar Novo Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:border-white/30 transition-all duration-500 transform hover:scale-[1.02]">
            
            {/* Header Section */}
            <div className="text-center mb-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <Link href="/" className="group">
                  <Image
                    src="/Dropa!.png"
                    alt="Dropa! - Colecionáveis Digitais"
                    width={220}
                    height={110}
                    className="drop-shadow-lg filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 cursor-pointer"
                    priority
                  />
                </Link>
              </div>
              
              {/* Welcome Text */}
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white flex items-center justify-center">
                  <span className="mr-3 text-4xl animate-bounce">🔐</span>
                  Nova Senha
                </h1>
                <p className="text-gray-300 text-lg">Defina sua nova senha secreta</p>
                <div className="flex items-center justify-center space-x-2 text-purple-300">
                  <span className="text-sm">🔒</span>
                  <span className="text-sm font-medium">Escolha uma senha forte e segura</span>
                  <span className="text-sm">🔒</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/50 text-red-100 px-5 py-4 rounded-2xl backdrop-blur-sm animate-shake">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {message && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 text-green-100 px-5 py-4 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">✅</span>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-purple-300 mb-3 flex items-center">
                  <span className="mr-2">🆕</span>
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 group-hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Digite sua nova senha"
                    required
                    minLength={6}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-blue-500/10 pointer-events-none transition-all duration-300"></div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-purple-300 mb-3 flex items-center">
                  <span className="mr-2">🔄</span>
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 group-hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Digite a senha novamente"
                    required
                    minLength={6}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-blue-500/10 pointer-events-none transition-all duration-300"></div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl p-4 text-white font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-2xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Redefinindo senha...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl group-hover:animate-pulse">🚀</span>
                      <span>Redefinir Senha</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-white/10">
              <p className="text-gray-300 mb-4">
                Lembrou da senha?{' '}
                <Link 
                  href="/auth/signin" 
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline"
                >
                  Voltar ao login 🔙
                </Link>
              </p>
              
              {/* Security Tips */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4 mt-6 border border-white/10">
                <div className="text-center">
                  <div className="text-2xl mb-2">💡</div>
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold mb-1">Dicas de segurança:</p>
                    <p className="text-xs">Use pelo menos 6 caracteres, combine letras e números.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}