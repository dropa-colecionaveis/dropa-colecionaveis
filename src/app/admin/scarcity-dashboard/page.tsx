'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'
import { ScarcityManager } from '@/lib/scarcity-system'

interface ScarcityStats {
  uniqueItems: {
    total: number
    claimed: number
    available: number
  }
  limitedEditions: {
    totalItems: number
    totalEditions: number
    maxEditions: number
  }
  temporalCollections: {
    total: number
    active: number
  }
  itemsByScarcity: {
    [key: string]: number
  }
}

export default function ScarcityDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [stats, setStats] = useState<ScarcityStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/scarcity-dashboard')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/dashboard')
      } else {
        fetchStats()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/scarcity-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching scarcity stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScarcityColor = (level: string) => {
    const colors = {
      'COMMON': 'text-gray-400',
      'UNCOMMON': 'text-green-400',
      'RARE': 'text-blue-400',
      'EPIC': 'text-purple-400',
      'LEGENDARY': 'text-yellow-400',
      'MYTHIC': 'text-red-400',
      'UNIQUE': 'text-pink-400'
    }
    return colors[level as keyof typeof colors] || 'text-gray-400'
  }

  const getScarcityEmoji = (level: string) => {
    const emojis = {
      'COMMON': '⚪',
      'UNCOMMON': '🟢',
      'RARE': '🔵',
      'EPIC': '🟣',
      'LEGENDARY': '🟡',
      'MYTHIC': '🔴',
      'UNIQUE': '🌟'
    }
    return emojis[level as keyof typeof emojis] || '⚪'
  }

  if (status === 'loading' || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-2xl font-bold text-white">
              Admin Panel
            </Link>
            <span className="text-gray-400">→</span>
            <span className="text-white">Dashboard de Escassez</span>
          </div>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">🌟 Dashboard de Escassez</h1>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
            >
              🔄 Atualizar
            </button>
          </div>

          {stats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Itens Únicos */}
              <div className="bg-pink-500/10 backdrop-blur-lg rounded-lg p-6 border border-pink-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🌟</span>
                  <h3 className="text-xl font-bold text-pink-400">Itens Únicos</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Total:</span>
                    <span className="text-white font-semibold">{stats.uniqueItems.total}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Reivindicados:</span>
                    <span className="text-red-400 font-semibold">{stats.uniqueItems.claimed}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Disponíveis:</span>
                    <span className="text-green-400 font-semibold">{stats.uniqueItems.available}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-pink-500 h-3 rounded-full" 
                      style={{ 
                        width: `${stats.uniqueItems.total > 0 ? (stats.uniqueItems.claimed / stats.uniqueItems.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    {stats.uniqueItems.total > 0 
                      ? `${Math.round((stats.uniqueItems.claimed / stats.uniqueItems.total) * 100)}% reivindicados`
                      : 'Nenhum item único'
                    }
                  </div>
                </div>
              </div>

              {/* Edições Limitadas */}
              <div className="bg-purple-500/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🏆</span>
                  <h3 className="text-xl font-bold text-purple-400">Edições Limitadas</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Itens Limitados:</span>
                    <span className="text-white font-semibold">{stats.limitedEditions.totalItems}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Edições Mintadas:</span>
                    <span className="text-purple-400 font-semibold">{stats.limitedEditions.totalEditions}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Máximo Possível:</span>
                    <span className="text-gray-400 font-semibold">
                      {stats.limitedEditions.maxEditions || 'Ilimitado'}
                    </span>
                  </div>
                </div>

                {stats.limitedEditions.maxEditions > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-purple-500 h-3 rounded-full" 
                        style={{ 
                          width: `${(stats.limitedEditions.totalEditions / stats.limitedEditions.maxEditions) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-center">
                      {Math.round((stats.limitedEditions.totalEditions / stats.limitedEditions.maxEditions) * 100)}% das edições mintadas
                    </div>
                  </div>
                )}
              </div>

              {/* Coleções Temporais */}
              <div className="bg-orange-500/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">⏰</span>
                  <h3 className="text-xl font-bold text-orange-400">Coleções Temporais</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Total:</span>
                    <span className="text-white font-semibold">{stats.temporalCollections.total}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Ativas:</span>
                    <span className="text-green-400 font-semibold">{stats.temporalCollections.active}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Expiradas:</span>
                    <span className="text-red-400 font-semibold">
                      {stats.temporalCollections.total - stats.temporalCollections.active}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-orange-500 h-3 rounded-full" 
                      style={{ 
                        width: `${stats.temporalCollections.total > 0 ? (stats.temporalCollections.active / stats.temporalCollections.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    {stats.temporalCollections.total > 0
                      ? `${Math.round((stats.temporalCollections.active / stats.temporalCollections.total) * 100)}% ainda ativas`
                      : 'Nenhuma coleção temporal'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Distribuição por Nível de Escassez */}
          {stats && (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-6">📊 Distribuição por Nível de Escassez</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(stats.itemsByScarcity)
                  .sort(([a], [b]) => {
                    const order = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'UNIQUE']
                    return order.indexOf(a) - order.indexOf(b)
                  })
                  .map(([level, count]) => (
                    <div key={level} className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">{getScarcityEmoji(level)}</div>
                      <div className={`font-bold text-lg ${getScarcityColor(level)}`}>
                        {ScarcityManager.getScarcityName(level as any)}
                      </div>
                      <div className="text-2xl font-bold text-white mt-2">{count}</div>
                      <div className="text-xs text-gray-400">itens</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 text-center space-x-4">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Painel Admin
            </Link>
            <Link
              href="/admin/items"
              className="text-blue-400 hover:text-blue-300 transition duration-200"
            >
              Gerenciar Itens →
            </Link>
            <Link
              href="/admin/collections"
              className="text-purple-400 hover:text-purple-300 transition duration-200"
            >
              Gerenciar Coleções →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}