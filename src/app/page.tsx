'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface PublicStats {
  totalItems: {
    count: number
    formatted: string
    label: string
  }
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
        const timestamp = Date.now()
        const response = await fetch(`/api/stats/public?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          console.error('Failed to fetch stats:', response.status)
          // Set fallback data instead of leaving stats null
          setStats({
            totalItems: { count: 100, formatted: '100+', label: 'Itens Cadastrados' },
            uniqueItems: { count: 0, formatted: '0', label: 'Itens Únicos' },
            totalUsers: { count: 0, formatted: '0', label: 'Jogadores Ativos' },
            packOpenings: { count: 0, formatted: '0', label: 'Pacotes Abertos' }
          })
        }
      } catch (error) {
        console.error('Network error fetching stats:', error)
        // Set fallback data on network error
        setStats({
          totalItems: { count: 100, formatted: '100+', label: 'Itens Cadastrados' },
          uniqueItems: { count: 0, formatted: '0', label: 'Itens Únicos' },
          totalUsers: { count: 0, formatted: '0', label: 'Jogadores Ativos' },
          packOpenings: { count: 0, formatted: '0', label: 'Pacotes Abertos' }
        })
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()

    // Auto-refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  // Don't block the page, just handle redirect when ready
  // if (status === 'loading') {
  //   return loading screen - removed to prevent blocking
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Session loading indicator */}
      {status === 'loading' && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse z-50"></div>
      )}

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

        {/* Genesis Collection Announcement */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-yellow-900/50 via-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl p-8 border-2 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 max-w-5xl mx-auto">
            <div className="text-6xl mb-4 animate-pulse">🌟</div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              GENESIS COLLECTION - A PRIMEIRA ERA
            </h2>
            <p className="text-xl text-gray-300 mb-6 leading-relaxed max-w-3xl mx-auto">
              O marco zero dos colecionáveis digitais chegou! A <span className="text-yellow-400 font-semibold">Genesis Collection</span> é
              a primeira coleção oficial da plataforma, apresentando um <span className="text-purple-400 font-semibold">sistema revolucionário
              de escassez multi-camadas</span> nunca visto antes.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-black/20 rounded-xl p-4 border border-yellow-500/20">
                <div className="text-3xl mb-2">🌟</div>
                <h4 className="text-yellow-400 font-bold mb-2">5 Itens Únicos</h4>
                <p className="text-sm text-gray-300">Apenas <span className="text-yellow-400">1 exemplar mundial</span> de cada item existirá PARA SEMPRE</p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-purple-500/20">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="text-purple-400 font-bold mb-2">Edições Limitadas</h4>
                <p className="text-sm text-gray-300">Itens com <span className="text-purple-400">numeração sequencial</span> (#001/1000)</p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-pink-500/20">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="text-pink-400 font-bold mb-2">7 Níveis de Escassez</h4>
                <p className="text-sm text-gray-300"><span className="text-pink-400">Sistema duplo</span> de raridade + escassez</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-600/10 to-purple-600/10 rounded-2xl p-6 border border-yellow-500/20 mb-6">
              <h4 className="text-lg font-bold text-white mb-3">🎯 Fornecimento Ultra-Limitado</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Apenas <span className="text-yellow-400 font-bold">5.005 itens especiais</span> da Genesis Collection poderão ser coletados por
                TODOS os jogadores do mundo: <span className="text-pink-400">5 únicos + 5.000 limitados</span>. Quando atingir este limite, <span className="text-red-400 font-semibold">NUNCA MAIS </span>
                serão distribuídos novos itens especiais desta coleção histórica.
              </p>
            </div>

            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-600 to-purple-600 hover:from-yellow-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25"
            >
              🚀 Descobrir Genesis Collection
            </Link>
          </div>
        </div>

        {/* Advanced Scarcity System */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-8">⚡ Sistema de Escassez Revolucionário</h2>
          <div className="max-w-6xl mx-auto">
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Diferente de qualquer plataforma existente, o <span className="text-purple-400 font-semibold">Dropa!</span> implementa
              um <span className="text-blue-400 font-semibold">sistema multi-camadas de escassez</span> que combina raridade tradicional
              com escassez real, criando uma economia digital única.
            </p>

            {/* Scarcity Levels */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-12">
              <div className="bg-gray-600/30 backdrop-blur-sm rounded-lg p-3 border border-gray-500/30 hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">⚪</div>
                <h4 className="text-gray-300 font-semibold text-sm">Comum</h4>
                <p className="text-xs text-gray-400">Abundante</p>
              </div>
              <div className="bg-green-600/30 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">🟢</div>
                <h4 className="text-green-300 font-semibold text-sm">Incomum</h4>
                <p className="text-xs text-green-400">Limitado</p>
              </div>
              <div className="bg-blue-600/30 backdrop-blur-sm rounded-lg p-3 border border-blue-500/30 hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">🔵</div>
                <h4 className="text-blue-300 font-semibold text-sm">Raro</h4>
                <p className="text-xs text-blue-400">Muito Limitado</p>
              </div>
              <div className="bg-purple-600/30 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30 hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">🟣</div>
                <h4 className="text-purple-300 font-semibold text-sm">Épico</h4>
                <p className="text-xs text-purple-400">Extremo</p>
              </div>
              <div className="bg-yellow-600/30 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/30 hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">🟡</div>
                <h4 className="text-yellow-300 font-semibold text-sm">Lendário</h4>
                <p className="text-xs text-yellow-400">Quase Impossível</p>
              </div>
              <div className="bg-red-600/30 backdrop-blur-sm rounded-lg p-3 border border-red-500/30 hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">🔴</div>
                <h4 className="text-red-300 font-semibold text-sm">Mítico</h4>
                <p className="text-xs text-red-400">Alguns Exemplares</p>
              </div>
              <div className="bg-pink-600/30 backdrop-blur-sm rounded-lg p-3 border border-pink-500/30 hover:scale-105 transition-transform animate-pulse">
                <div className="text-3xl mb-2">🌟</div>
                <h4 className="text-pink-300 font-semibold text-sm">Único</h4>
                <p className="text-xs text-pink-400">1 no Mundo</p>
              </div>
            </div>

            {/* Scarcity Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-pink-900/40 to-purple-900/40 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-5xl mb-4">🌟</div>
                <h3 className="text-xl font-bold text-pink-400 mb-3">Itens Únicos</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Apenas <span className="text-pink-400 font-semibold">1 exemplar mundial</span> existe.
                  Quando alguém o obtém, <span className="text-red-400">NUNCA MAIS</span> pode ser encontrado por outros jogadores.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-purple-400 mb-3">Edições Limitadas</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Itens com <span className="text-purple-400 font-semibold">numeração sequencial</span> (#001/100).
                  Cada edição tem seu número único e quando esgotar, <span className="text-red-400">nunca mais</span> será criada.
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-5xl mb-4">⏰</div>
                <h3 className="text-xl font-bold text-orange-400 mb-3">Temporalidade</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Algumas coleções têm <span className="text-orange-400 font-semibold">prazo de validade</span>.
                  Quando o tempo acabar, <span className="text-red-400">desaparecem para sempre</span> e nunca mais podem ser obtidas.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-blue-400 mb-3">Fornecimento Controlado</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Cada coleção tem um <span className="text-blue-400 font-semibold">limite máximo</span> de itens que podem ser coletados.
                  Esgotou? <span className="text-red-400">Fim da história</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-8">🎮 Como Funciona a Dinâmica</h2>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-2xl font-bold text-green-400 mb-4">1. Compre Créditos</h3>
                <p className="text-gray-300 leading-relaxed">
                  Adquira créditos com <span className="text-green-400 font-semibold">dinheiro real</span> através de PIX.
                  Seus créditos são a moeda do universo Dropa!
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-purple-400 mb-4">2. Abra Pacotes</h3>
                <p className="text-gray-300 leading-relaxed">
                  Use seus créditos para abrir <span className="text-purple-400 font-semibold">pacotes místicos</span>.
                  Cada pacote tem probabilidades diferentes e pode conter desde itens comuns até únicos!
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold text-blue-400 mb-4">3. Colecione & Trade</h3>
                <p className="text-gray-300 leading-relaxed">
                  Construa sua <span className="text-blue-400 font-semibold">coleção épica</span>,
                  complete sets, troque no marketplace e torne-se uma <span className="text-yellow-400">lenda</span>!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pack Types */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-8">🎁 Tipos de Pacotes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-amber-800/30 to-yellow-800/30 backdrop-blur-sm rounded-lg p-4 border border-amber-500/30 hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">🥉</div>
              <h4 className="text-amber-300 font-semibold">Bronze</h4>
              <p className="text-xs text-amber-400 mb-2">25 créditos</p>
              <div className="text-xs text-gray-300 space-y-1">
                <div>🟡 Lendário: 1%</div>
                <div>🟣 Épico: 4%</div>
                <div>🔵 Raro: 10%</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-700/30 to-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-gray-500/30 hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">🥈</div>
              <h4 className="text-gray-300 font-semibold">Prata</h4>
              <p className="text-xs text-gray-400 mb-2">35 créditos</p>
              <div className="text-xs text-gray-300 space-y-1">
                <div>🟡 Lendário: 1%</div>
                <div>🟣 Épico: 6%</div>
                <div>🔵 Raro: 15%</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30 hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">🥇</div>
              <h4 className="text-yellow-300 font-semibold">Ouro</h4>
              <p className="text-xs text-yellow-400 mb-2">45 créditos</p>
              <div className="text-xs text-gray-300 space-y-1">
                <div>🟡 Lendário: 3%</div>
                <div>🟣 Épico: 10%</div>
                <div>🔵 Raro: 20%</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-600/30 to-zinc-600/30 backdrop-blur-sm rounded-lg p-4 border border-slate-500/30 hover:scale-105 transition-transform">
              <div className="text-3xl mb-2">💎</div>
              <h4 className="text-slate-300 font-semibold">Platina</h4>
              <p className="text-xs text-slate-400 mb-2">75 créditos</p>
              <div className="text-xs text-gray-300 space-y-1">
                <div>🟡 Lendário: 7%</div>
                <div>🟣 Épico: 15%</div>
                <div>🔵 Raro: 28%</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-600/30 to-blue-700/30 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/30 hover:scale-105 transition-transform animate-pulse">
              <div className="text-3xl mb-2">💠</div>
              <h4 className="text-cyan-300 font-semibold">Diamante</h4>
              <p className="text-xs text-cyan-400 mb-2">95 créditos</p>
              <div className="text-xs text-gray-300 space-y-1">
                <div>🟡 Lendário: 10%</div>
                <div>🟣 Épico: 30%</div>
                <div>🔵 Raro: 28%</div>
              </div>
            </div>
          </div>
          <p className="text-gray-300 mt-6 text-sm">
            💡 <span className="text-yellow-400 font-semibold">Dica:</span> Pacotes mais caros têm maior chance de itens raros,
            mas mesmo no Bronze você pode encontrar itens <span className="text-pink-400">únicos</span>!
          </p>
        </div>

        {/* Genesis Unique Items Showcase */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-8">👑 Itens Únicos da Genesis Collection</h2>
          <p className="text-gray-300 mb-12 max-w-3xl mx-auto">
            Conheça os <span className="text-pink-400 font-semibold">5 itens únicos</span> da Genesis Collection.
            Apenas <span className="text-yellow-400 font-bold">1 pessoa no mundo inteiro</span> poderá possuir cada um destes tesouros lendários:
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-yellow-500/30 hover:border-yellow-400/60 transition-all duration-300 hover:scale-105 col-span-full lg:col-span-1">
              <div className="text-6xl mb-4 animate-pulse">💎</div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">Cristal do Gênesis</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                O primeiro cristal único jamais criado. Apenas 1 exemplar existirá para sempre.
              </p>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Raridade:</span>
                  <span className="text-yellow-400 font-semibold">🟡 Lendário</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Escassez:</span>
                  <span className="text-pink-400 font-semibold">🌟 Único</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor:</span>
                  <span className="text-green-400 font-semibold">2.250 créditos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-red-400 font-semibold animate-pulse">🔍 Não descoberto</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105">
              <div className="text-6xl mb-4 animate-pulse">👑</div>
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Coroa Primordial</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                A coroa dos primeiros reis digitais. Apenas 1 pessoa no mundo será seu proprietário.
              </p>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Raridade:</span>
                  <span className="text-yellow-400 font-semibold">🟡 Lendário</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Escassez:</span>
                  <span className="text-pink-400 font-semibold">🌟 Único</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor:</span>
                  <span className="text-green-400 font-semibold">2.250 créditos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-red-400 font-semibold animate-pulse">🔍 Aguardando</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105">
              <div className="text-6xl mb-4 animate-pulse">🌟</div>
              <h3 className="text-2xl font-bold text-blue-400 mb-3">Essência da Origem</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                A primeira essência criada no universo digital. Única e irrepetível.
              </p>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Raridade:</span>
                  <span className="text-yellow-400 font-semibold">🟡 Lendário</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Escassez:</span>
                  <span className="text-pink-400 font-semibold">🌟 Único</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor:</span>
                  <span className="text-green-400 font-semibold">2.250 créditos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-cyan-400 font-semibold animate-pulse">🔍 Mistério</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105">
              <div className="text-6xl mb-4 animate-pulse">🗝️</div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-3">Chave do Cosmos</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                A única chave capaz de abrir os mistérios do universo digital.
              </p>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Raridade:</span>
                  <span className="text-yellow-400 font-semibold">🟡 Lendário</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Escassez:</span>
                  <span className="text-pink-400 font-semibold">🌟 Único</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor:</span>
                  <span className="text-green-400 font-semibold">2.250 créditos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-indigo-400 font-semibold animate-pulse">🗝️ Oculto</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 backdrop-blur-lg rounded-2xl p-6 border-2 border-red-500/30 hover:border-red-400/60 transition-all duration-300 hover:scale-105">
              <div className="text-6xl mb-4 animate-pulse">🔥</div>
              <h3 className="text-2xl font-bold text-red-400 mb-3">Alma do Primeiro</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                A alma do primeiro ser digital. Indivisível e eterna. O mais valioso de todos.
              </p>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Raridade:</span>
                  <span className="text-yellow-400 font-semibold">🟡 Lendário</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Escassez:</span>
                  <span className="text-pink-400 font-semibold">🌟 Único</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor:</span>
                  <span className="text-green-400 font-semibold">2.250 créditos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-yellow-400 font-semibold animate-pulse">👑 Lenda Suprema</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 backdrop-blur-lg rounded-2xl p-6 border border-red-500/20 mt-8 max-w-4xl mx-auto">
            <h4 className="text-xl font-bold text-red-400 mb-3">⚠️ ATENÇÃO: Escassez Real</h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Estes itens são <span className="text-red-400 font-semibold">verdadeiramente únicos</span>. Quando alguém obtém um item único,
              ele <span className="text-yellow-400 font-bold">desaparece permanentemente</span> do pool de drops.
              <span className="text-pink-400 font-semibold">Não há como criar duplicatas</span> ou "resetar" o item.
            </p>
            <p className="text-yellow-300 text-sm font-semibold">
              🎯 A pessoa que conseguir um destes itens se tornará uma lenda na história da plataforma!
            </p>
          </div>
        </div>

        {/* Urgency & FOMO Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-red-900/50 via-orange-900/50 to-yellow-900/50 backdrop-blur-lg rounded-3xl p-8 border-2 border-red-500/30 hover:border-red-400/50 transition-all duration-300 max-w-5xl mx-auto">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-6">
              A CORRIDA PELOS ÚNICOS JÁ COMEÇOU!
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Outros jogadores já estão se cadastrando e comprando créditos para serem os primeiros a abrir pacotes.
              <span className="text-red-400 font-semibold"> Cada segundo que passa é uma chance perdida</span> de ser o único proprietário
              de um tesouro digital histórico.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/30 rounded-xl p-4 border border-red-500/20">
                <div className="text-3xl mb-2">🏃‍♂️</div>
                <h4 className="text-red-400 font-bold mb-2">Competição Acirrada</h4>
                <p className="text-sm text-gray-300">Milhares de jogadores disputando os mesmos 5 itens únicos</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-orange-500/20">
                <div className="text-3xl mb-2">📈</div>
                <h4 className="text-orange-400 font-bold mb-2">Valor Crescente</h4>
                <p className="text-sm text-gray-300">Conforme itens são descobertos, a pressão pelos restantes aumenta</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/20">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="text-yellow-400 font-bold mb-2">Oportunidade Única</h4>
                <p className="text-sm text-gray-300">Esta é a ÚNICA chance na história de conseguir estes itens</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/auth/signup"
                className="group relative px-10 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25"
              >
                <span className="relative z-10">⚡ Entrar na Corrida AGORA</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </Link>
              <div className="text-gray-400 text-sm">
                ⏰ Cadastro grátis em 30 segundos
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Real Data with Enhanced Skeleton Loading */}
        <div className="grid md:grid-cols-4 gap-6 mb-16 max-w-6xl mx-auto">
          {/* Total de Itens Cadastrados */}
          <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-green-400/50 transition-all duration-300 group">
            <div className="text-4xl font-bold text-green-400 mb-2 min-h-[48px] flex items-center justify-center">
              {statsLoading ? (
                <div className="relative">
                  <div className="animate-pulse bg-gradient-to-r from-green-300/20 via-green-300/40 to-green-300/20 h-12 w-20 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-300/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              ) : (
                <span className="animate-fade-in group-hover:scale-110 transition-transform duration-300">
                  {stats?.totalItems?.formatted || '100+'}
                </span>
              )}
            </div>
            <div className="text-gray-300 group-hover:text-green-300 transition-colors duration-300">
              {statsLoading ? (
                <div className="animate-pulse bg-gray-300/20 h-4 w-28 rounded mx-auto"></div>
              ) : (
                <p>{stats?.totalItems?.label || 'Itens Cadastrados'}</p>
              )}
            </div>
          </div>
          {/* Items Únicos */}
          <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all duration-300 group">
            <div className="text-4xl font-bold text-purple-400 mb-2 min-h-[48px] flex items-center justify-center">
              {statsLoading ? (
                <div className="relative">
                  <div className="animate-pulse bg-gradient-to-r from-purple-300/20 via-purple-300/40 to-purple-300/20 h-12 w-20 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              ) : (
                <span className="animate-fade-in group-hover:scale-110 transition-transform duration-300">
                  {stats?.uniqueItems?.formatted || '0'}
                </span>
              )}
            </div>
            <div className="text-gray-300 group-hover:text-purple-300 transition-colors duration-300">
              {statsLoading ? (
                <div className="animate-pulse bg-gray-300/20 h-4 w-24 rounded mx-auto"></div>
              ) : (
                <p>{stats?.uniqueItems?.label || 'Itens Únicos'}</p>
              )}
            </div>
          </div>

          {/* Jogadores Ativos */}
          <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-400/50 transition-all duration-300 group">
            <div className="text-4xl font-bold text-blue-400 mb-2 min-h-[48px] flex items-center justify-center">
              {statsLoading ? (
                <div className="relative">
                  <div className="animate-pulse bg-gradient-to-r from-blue-300/20 via-blue-300/40 to-blue-300/20 h-12 w-20 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              ) : (
                <span className="animate-fade-in group-hover:scale-110 transition-transform duration-300">
                  {stats?.totalUsers?.formatted || '0'}
                </span>
              )}
            </div>
            <div className="text-gray-300 group-hover:text-blue-300 transition-colors duration-300">
              {statsLoading ? (
                <div className="animate-pulse bg-gray-300/20 h-4 w-32 rounded mx-auto"></div>
              ) : (
                <p>{stats?.totalUsers?.label || 'Jogadores Ativos'}</p>
              )}
            </div>
          </div>

          {/* Pacotes Abertos */}
          <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-indigo-400/50 transition-all duration-300 group">
            <div className="text-4xl font-bold text-indigo-400 mb-2 min-h-[48px] flex items-center justify-center">
              {statsLoading ? (
                <div className="relative">
                  <div className="animate-pulse bg-gradient-to-r from-indigo-300/20 via-indigo-300/40 to-indigo-300/20 h-12 w-20 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-300/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              ) : (
                <span className="animate-fade-in group-hover:scale-110 transition-transform duration-300">
                  {stats?.packOpenings?.formatted || '0'}
                </span>
              )}
            </div>
            <div className="text-gray-300 group-hover:text-indigo-300 transition-colors duration-300">
              {statsLoading ? (
                <div className="animate-pulse bg-gray-300/20 h-4 w-28 rounded mx-auto"></div>
              ) : (
                <p>{stats?.packOpenings?.label || 'Pacotes Abertos'}</p>
              )}
            </div>
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

      {/* Footer */}
      <footer className="relative z-10 bg-black/30 backdrop-blur-lg border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <Image
                  src="/Dropa!.png"
                  alt="Dropa!"
                  width={120}
                  height={60}
                  className="filter drop-shadow-lg"
                />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                A plataforma definitiva de colecionáveis digitais com sistema revolucionário de escassez multi-camadas.
              </p>
              <div className="flex space-x-4">
                <div className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">
                  <span className="text-2xl">📧</span>
                </div>
                <div className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="text-green-400 hover:text-green-300 transition-colors cursor-pointer">
                  <span className="text-2xl">📱</span>
                </div>
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <h4 className="text-white font-bold mb-4">Plataforma</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/auth/signup" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Criar Conta
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signin" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Fazer Login
                  </Link>
                </li>
                <li>
                  <Link href="/como-funciona" className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-semibold">
                    📚 Como Funciona
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coleções */}
            <div>
              <h4 className="text-white font-bold mb-4">Coleções</h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-yellow-400 text-sm font-semibold">
                    🌟 Genesis Collection
                  </span>
                </li>
                <li>
                  <span className="text-gray-300 text-sm">
                    110 Itens
                  </span>
                </li>
                <li>
                  <span className="text-pink-400 text-sm">
                    5 Itens Únicos Mundiais
                  </span>
                </li>
                <li>
                  <span className="text-gray-500 text-sm">
                    Futuras Coleções (A ser anunciado)
                  </span>
                </li>
              </ul>
            </div>

            {/* Suporte & Legal */}
            <div>
              <h4 className="text-white font-bold mb-4">Suporte & Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-gray-500 text-sm cursor-not-allowed">
                    Termos de Uso (Em Breve)
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-500 text-sm cursor-not-allowed">
                    Política de Privacidade (Em Breve)
                  </Link>
                </li>
                <li>
                  <Link href="/suporte" className="text-gray-300 hover:text-white transition-colors text-sm">
                    📚 Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="/contato" className="text-gray-300 hover:text-white transition-colors text-sm">
                    📞 Contato
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                <p>© 2025 Dropa! Colecionáveis Digitais. Todos os direitos reservados.</p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>•</span>
                <Link href="/como-funciona" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  📖 Entenda o Sistema
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
