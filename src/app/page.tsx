'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface PublicStats {
  uniqueItems: {
    count: number
    formatted: string
    label: string
  }
  totalUsers: {
    count: number
    formatted: string
    label: string
  }
  packOpenings: {
    count: number
    formatted: string
    label: string
  }
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  // Buscar estatísticas públicas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/public')
        if (response.ok) {
          const data = await response.json()
          console.log('Stats data received:', data) // Debug log
          setStats(data)
        } else {
          console.error('Stats API response not ok:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl animate-pulse">⚡ Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-purple-300/20 text-6xl animate-pulse">⚡</div>
        <div className="absolute top-40 right-20 text-blue-300/20 text-4xl animate-bounce">💎</div>
        <div className="absolute bottom-40 left-1/4 text-indigo-300/20 text-5xl animate-pulse delay-300">🌟</div>
        <div className="absolute bottom-20 right-1/3 text-purple-300/20 text-3xl animate-bounce delay-500">⚔️</div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <Image
                src="/Dropa!.png"
                alt="Dropa! - Colecionáveis Digitais"
                width={350}
                height={175}
                className="drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-90 transition-opacity -z-10 scale-110"></div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 mb-6 leading-tight px-2 sm:px-4 text-center">
            COLECIONÁVEIS DIGITAIS
          </h1>

          <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto font-light">
            Entre na <span className="text-purple-400 font-semibold">arena definitiva</span> de colecionáveis digitais.
            Abra pacotes místicos, desbloqueie raridades lendárias e construa sua coleção épica!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link
              href="/auth/signup"
              className="group relative px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
            >
              <span className="relative z-10">⚡ Iniciar Jornada</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            </Link>
            <Link
              href="/auth/signin"
              className="px-10 py-4 border-2 border-purple-400 text-purple-300 hover:bg-purple-600 hover:text-white font-bold text-lg rounded-xl transition-all duration-300 hover:border-purple-600 hover:shadow-lg"
            >
              🔑 Fazer Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="group bg-gradient-to-br from-purple-800/40 to-blue-800/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-5xl mb-4 group-hover:animate-bounce">📦</div>
            <h3 className="text-xl font-bold text-white mb-3">Pacotes Místicos</h3>
            <p className="text-gray-300 text-sm leading-relaxed">Abra pacotes com animações épicas e descubra itens de raridades únicas</p>
          </div>

          <div className="group bg-gradient-to-br from-blue-800/40 to-indigo-800/40 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-5xl mb-4 group-hover:animate-pulse">💎</div>
            <h3 className="text-xl font-bold text-white mb-3">Raridades Épicas</h3>
            <p className="text-gray-300 text-sm leading-relaxed">5 níveis de raridade: Comum, Incomum, Raro, Épico e Lendário</p>
          </div>

          <div className="group bg-gradient-to-br from-indigo-800/40 to-purple-800/40 backdrop-blur-lg rounded-2xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
            <div className="text-5xl mb-4 group-hover:animate-pulse group-hover:scale-110 transition-transform duration-300">🏆</div>
            <h3 className="text-xl font-bold text-white mb-3">Sistema de Conquistas</h3>
            <p className="text-gray-300 text-sm leading-relaxed">Desbloqueie conquistas, suba de nível e domine os rankings</p>
          </div>

          <div className="group bg-gradient-to-br from-purple-800/40 to-pink-800/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-5xl mb-4 group-hover:animate-bounce">🛒</div>
            <h3 className="text-xl font-bold text-white mb-3">Marketplace</h3>
            <p className="text-gray-300 text-sm leading-relaxed">Compre e venda itens com outros jogadores em um mercado dinâmico</p>
          </div>
        </div>

        {/* Rarity Showcase */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-8">🌟 Sistema de Raridades</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            <div className="bg-gray-600/30 backdrop-blur-sm rounded-lg p-4 border border-gray-500/30">
              <div className="w-12 h-12 bg-gray-500 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold">C</div>
              <h4 className="text-gray-300 font-semibold">Comum</h4>
              <p className="text-xs text-gray-400">60% - 5 créditos</p>
            </div>
            <div className="bg-green-600/30 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
              <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold">I</div>
              <h4 className="text-green-300 font-semibold">Incomum</h4>
              <p className="text-xs text-green-400">25% - 15 créditos</p>
            </div>
            <div className="bg-blue-600/30 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold">R</div>
              <h4 className="text-blue-300 font-semibold">Raro</h4>
              <p className="text-xs text-blue-400">10% - 40 créditos</p>
            </div>
            <div className="bg-purple-600/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
              <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold">E</div>
              <h4 className="text-purple-300 font-semibold">Épico</h4>
              <p className="text-xs text-purple-400">4% - 100 créditos</p>
            </div>
            <div className="bg-yellow-600/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold animate-pulse">L</div>
              <h4 className="text-yellow-300 font-semibold">Lendário</h4>
              <p className="text-xs text-yellow-400">1% - 500 créditos</p>
            </div>
          </div>
        </div>

        {/* Stats Section - Real Data */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {statsLoading ? (
                <div className="animate-pulse bg-purple-300/30 h-12 w-20 rounded mx-auto"></div>
              ) : (
                <span>{stats?.uniqueItems?.formatted ?? 'N/A'}</span>
              )}
            </div>
            <p className="text-gray-300">
              {stats?.uniqueItems?.label ?? 'Itens Únicos'}
            </p>
            {!statsLoading && !stats && (
              <p className="text-xs text-red-400 mt-2">Erro ao carregar dados</p>
            )}
          </div>
          <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {statsLoading ? (
                <div className="animate-pulse bg-blue-300/30 h-12 w-20 rounded mx-auto"></div>
              ) : (
                <span>{stats?.totalUsers?.formatted ?? 'N/A'}</span>
              )}
            </div>
            <p className="text-gray-300">
              {stats?.totalUsers?.label ?? 'Jogadores Ativos'}
            </p>
            {!statsLoading && !stats && (
              <p className="text-xs text-red-400 mt-2">Erro ao carregar dados</p>
            )}
          </div>
          <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="text-4xl font-bold text-indigo-400 mb-2">
              {statsLoading ? (
                <div className="animate-pulse bg-indigo-300/30 h-12 w-20 rounded mx-auto"></div>
              ) : (
                <span>{stats?.packOpenings?.formatted ?? 'N/A'}</span>
              )}
            </div>
            <p className="text-gray-300">
              {stats?.packOpenings?.label ?? 'Pacotes Abertos'}
            </p>
            {!statsLoading && !stats && (
              <p className="text-xs text-red-400 mt-2">Erro ao carregar dados</p>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">🚀 Pronto para a Aventura no Dropa!?</h3>
            <p className="text-gray-300 mb-6">Junte-se a milhares de colecionadores e inicie sua jornada épica no universo Dropa! hoje mesmo!</p>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              ⚡ Começar Agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
