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

interface UniqueItemDetail {
  userItemId: string
  obtainedAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
  pack: {
    id: string
    name: string
    price: number
    type: string
  } | null
  packOpeningId: string | null
}

interface UniqueItemGroup {
  item: {
    id: string
    name: string
    imageUrl: string | null
    rarity: string
    scarcityLevel: string
    uniqueOwnerId: string | null
  }
  acquisitions: UniqueItemDetail[]
}

interface UniqueItemsData {
  groupedByItem: Record<string, UniqueItemGroup>
  allAcquisitions: (UniqueItemDetail & { item: UniqueItemGroup['item'] })[]
  stats: {
    totalUniqueItems: number
    totalAcquisitions: number
    uniqueUsers: number
    packsSources: string[]
  }
}

export default function ScarcityDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [stats, setStats] = useState<ScarcityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showUniqueDetails, setShowUniqueDetails] = useState(false)
  const [uniqueItemsData, setUniqueItemsData] = useState<UniqueItemsData | null>(null)
  const [loadingUniqueDetails, setLoadingUniqueDetails] = useState(false)

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

  const refreshStats = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/admin/refresh-scarcity-stats', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
        alert('✅ Estatísticas atualizadas com sucesso!')
      } else {
        alert('❌ Erro ao atualizar estatísticas')
      }
    } catch (error) {
      console.error('Error refreshing stats:', error)
      alert('❌ Erro ao atualizar estatísticas')
    } finally {
      setRefreshing(false)
    }
  }

  const fetchUniqueItemsDetails = async () => {
    setLoadingUniqueDetails(true)
    try {
      const response = await fetch('/api/admin/unique-items-details')
      if (response.ok) {
        const data = await response.json()
        setUniqueItemsData(data.data)
        setShowUniqueDetails(true)
      } else {
        alert('❌ Erro ao carregar detalhes dos itens únicos')
      }
    } catch (error) {
      console.error('Error fetching unique items details:', error)
      alert('❌ Erro ao carregar detalhes dos itens únicos')
    } finally {
      setLoadingUniqueDetails(false)
    }
  }

  const getScarcityColor = (level: string) => {
    const colors = {
      'COMMON': 'text-gray-400',
      'UNCOMMON': 'text-green-400',
      'RARE': 'text-blue-400',
      'LEGENDARY': 'text-yellow-400',
      'UNIQUE': 'text-pink-400'
    }
    return colors[level as keyof typeof colors] || 'text-gray-400'
  }

  const getScarcityEmoji = (level: string) => {
    const emojis = {
      'COMMON': '⚪',
      'UNCOMMON': '🟢',
      'RARE': '🔵',
      'LEGENDARY': '🟡',
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
            <div className="flex space-x-3">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition duration-200"
              >
                📊 Recarregar
              </button>
              <button
                onClick={refreshStats}
                disabled={refreshing}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition duration-200"
              >
                {refreshing ? '⏳ Atualizando...' : '🔄 Refresh DB'}
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition duration-200"
              >
                🔍 {showDebug ? 'Ocultar' : 'Debug'}
              </button>
            </div>
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

                {/* Botão para ver detalhes */}
                {stats.uniqueItems.claimed > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={fetchUniqueItemsDetails}
                      disabled={loadingUniqueDetails}
                      className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white rounded text-sm transition duration-200"
                    >
                      {loadingUniqueDetails ? '⏳ Carregando...' : '👥 Ver Detalhes dos Proprietários'}
                    </button>
                  </div>
                )}
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
                          width: `${Math.max((stats.limitedEditions.totalEditions / stats.limitedEditions.maxEditions) * 100, stats.limitedEditions.totalEditions > 0 ? 2 : 0)}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-center">
                      {(() => {
                        const percentage = (stats.limitedEditions.totalEditions / stats.limitedEditions.maxEditions) * 100
                        if (percentage < 0.1 && percentage > 0) {
                          return `<0.1% das edições mintadas`
                        } else if (percentage < 1) {
                          return `${percentage.toFixed(1)}% das edições mintadas`
                        } else {
                          return `${Math.round(percentage)}% das edições mintadas`
                        }
                      })()}
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
                    const order = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'UNIQUE']
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

          {/* Debug Information */}
          {showDebug && stats && (stats as any)._debug && (
            <div className="mt-8 bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 border border-gray-600">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">🔍 Informações de Debug</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">📅 Dados da Consulta</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Timestamp:</span>
                      <span className="text-yellow-400">{new Date((stats as any)._debug.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Última atualização:</span>
                      <span className="text-yellow-400">{new Date().toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">📊 Valores Brutos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Únicos Total:</span>
                      <span className="text-pink-400">{(stats as any)._debug.rawStats[0]}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Únicos Claimed:</span>
                      <span className="text-red-400">{(stats as any)._debug.rawStats[1]}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Limitadas Total:</span>
                      <span className="text-purple-400">{(stats as any)._debug.rawStats[2]}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Edições Mintadas:</span>
                      <span className="text-purple-400">{(stats as any)._debug.rawStats[3]._sum.currentEditions || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-3">🏷️ Distribuição de Escassez</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(stats as any)._debug.scarcityBreakdown.map((item: any, index: number) => (
                    <div key={index} className="bg-gray-700/50 rounded p-3 text-center">
                      <div className="text-yellow-400 font-semibold">{item.scarcityLevel || 'NULL'}</div>
                      <div className="text-white text-lg">{item._count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal de Detalhes dos Itens Únicos */}
          {showUniqueDetails && uniqueItemsData && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-white">👥 Detalhes dos Itens Únicos</h2>
                      <p className="text-gray-300 mt-1">
                        {uniqueItemsData.stats.totalUniqueItems} itens únicos • {uniqueItemsData.stats.totalAcquisitions} aquisições • {uniqueItemsData.stats.uniqueUsers} usuários únicos
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUniqueDetails(false)}
                      className="text-white hover:text-red-400 text-2xl font-bold transition duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Estatísticas Resumidas */}
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-2xl text-pink-400 font-bold">{uniqueItemsData.stats.totalUniqueItems}</div>
                      <div className="text-sm text-gray-300">Itens Únicos</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-2xl text-blue-400 font-bold">{uniqueItemsData.stats.totalAcquisitions}</div>
                      <div className="text-sm text-gray-300">Total Aquisições</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-2xl text-green-400 font-bold">{uniqueItemsData.stats.uniqueUsers}</div>
                      <div className="text-sm text-gray-300">Usuários Únicos</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-2xl text-yellow-400 font-bold">{uniqueItemsData.stats.packsSources.length}</div>
                      <div className="text-sm text-gray-300">Tipos de Pacotes</div>
                    </div>
                  </div>

                  {/* Lista de Itens e Proprietários */}
                  <div className="space-y-6">
                    {Object.values(uniqueItemsData.groupedByItem).map((itemGroup) => (
                      <div key={itemGroup.item.id} className="bg-black/20 rounded-lg p-6 border border-white/10">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                            {itemGroup.item.imageUrl ? (
                              <img src={itemGroup.item.imageUrl} alt={itemGroup.item.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-2xl">🌟</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-pink-400">{itemGroup.item.name}</h3>
                            <div className="flex space-x-4 text-sm text-gray-300">
                              <span>Raridade: <span className="text-purple-400">{itemGroup.item.rarity}</span></span>
                              <span>Escassez: <span className="text-pink-400">{itemGroup.item.scarcityLevel}</span></span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold text-white">Aquisições ({itemGroup.acquisitions.length})</h4>
                          {itemGroup.acquisitions.map((acquisition, index) => (
                            <div key={acquisition.userItemId} className="bg-white/5 rounded-lg p-4">
                              <div className="grid md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Usuário:</span>
                                  <div className="text-white font-medium">{acquisition.user.email}</div>
                                  {acquisition.user.name && (
                                    <div className="text-gray-300">{acquisition.user.name}</div>
                                  )}
                                </div>
                                <div>
                                  <span className="text-gray-400">Data/Hora:</span>
                                  <div className="text-white">{new Date(acquisition.obtainedAt).toLocaleString('pt-BR')}</div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Pacote:</span>
                                  <div className="text-white">{acquisition.pack?.name || 'N/A'}</div>
                                  {acquisition.pack && (
                                    <div className="text-gray-300">{acquisition.pack.price} créditos</div>
                                  )}
                                </div>
                                <div>
                                  <span className="text-gray-400">Tipo:</span>
                                  <div className="text-white">{acquisition.pack?.type || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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