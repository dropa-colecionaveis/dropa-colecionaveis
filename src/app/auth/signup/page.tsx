'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        // Wait a moment for database consistency then auto sign in
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          console.error('Auto-login error after registration:', result.error)
          setError('Registration successful! Please sign in manually.')
          router.push('/auth/signin')
        } else if (result?.ok) {
          router.push('/dashboard')
        } else {
          setError('Registration successful! Please sign in manually.')
          router.push('/auth/signin')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
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
                  <span className="mr-3 text-4xl animate-bounce">🌟</span>
                  Junte-se à aventura!
                </h1>
                <p className="text-gray-300 text-lg">Crie sua conta e inicie sua jornada épica</p>
                <div className="flex items-center justify-center space-x-2 text-green-300">
                  <span className="text-sm">🎮</span>
                  <span className="text-sm font-medium">Colecionáveis digitais exclusivos</span>
                  <span className="text-sm">🎮</span>
                </div>
              </div>
            </div>

            {/* Social Login */}
            <div className="mb-8">
              <button
                onClick={() => handleSocialSignIn('google')}
                className="group w-full relative overflow-hidden bg-gradient-to-r from-green-600/20 to-cyan-600/20 hover:from-green-600/30 hover:to-cyan-600/30 border border-white/20 hover:border-white/40 rounded-2xl p-4 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-2xl group-hover:animate-pulse">✨</div>
                  <span className="text-white font-semibold group-hover:text-gray-100">Começar com Google</span>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gradient-to-r from-green-600/20 to-cyan-600/20 backdrop-blur-sm text-gray-300 text-sm font-medium rounded-full border border-white/20">
                  ou crie com email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/50 text-red-100 px-5 py-4 rounded-2xl backdrop-blur-sm animate-shake">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Name Field */}
              <div className="group">
                <label htmlFor="name" className="block text-sm font-semibold text-green-300 mb-3 flex items-center">
                  <span className="mr-2">👤</span>
                  Nome de herói
                </label>
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 group-hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Seu nome épico"
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 to-cyan-500/0 group-focus-within:from-green-500/10 group-focus-within:to-cyan-500/10 pointer-events-none transition-all duration-300"></div>
                </div>
              </div>

              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-green-300 mb-3 flex items-center">
                  <span className="mr-2">📧</span>
                  Endereço de email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 group-hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    placeholder="seu@email.com"
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 to-cyan-500/0 group-focus-within:from-green-500/10 group-focus-within:to-cyan-500/10 pointer-events-none transition-all duration-300"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-green-300 mb-3 flex items-center">
                  <span className="mr-2">🔒</span>
                  Senha secreta
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 group-hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    placeholder="••••••••••••"
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 to-cyan-500/0 group-focus-within:from-green-500/10 group-focus-within:to-cyan-500/10 pointer-events-none transition-all duration-300"></div>
                </div>
                <div className="mt-2 text-xs text-gray-400 flex items-center">
                  <span className="mr-1">💡</span>
                  Mínimo 6 caracteres para máxima segurança
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-green-300 mb-3 flex items-center">
                  <span className="mr-2">🔐</span>
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 group-hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    placeholder="••••••••••••"
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 to-cyan-500/0 group-focus-within:from-green-500/10 group-focus-within:to-cyan-500/10 pointer-events-none transition-all duration-300"></div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl p-4 text-white font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-2xl mt-6"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Criando sua conta épica...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl group-hover:animate-pulse">🚀</span>
                      <span>Começar Aventura</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-white/10">
              <p className="text-gray-300 mb-4">
                Já tem uma conta?{' '}
                <Link 
                  href="/auth/signin" 
                  className="text-green-400 hover:text-green-300 font-semibold transition-colors duration-200 hover:underline"
                >
                  Entre na sua conta
                </Link>
              </p>
              
              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-600/10 to-cyan-600/10 rounded-2xl p-4 mt-6 border border-white/10">
                <div className="text-green-300 font-semibold mb-3 flex items-center justify-center">
                  <span className="mr-2">🎁</span>
                  O que você ganha ao se cadastrar
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span>🎮</span>
                    <span>Pacotes grátis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🏆</span>
                    <span>Rankings globais</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>💎</span>
                    <span>Itens exclusivos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>⭐</span>
                    <span>Conquistas épicas</span>
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