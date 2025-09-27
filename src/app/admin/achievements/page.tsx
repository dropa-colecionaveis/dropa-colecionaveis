'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HealthData {
  timestamp: string
  overview: {
    totalAchievements: number
    activeAchievements: number
    totalUsers: number
    usersWithAchievements: number
    engagementRate: number
  }
  categoryStats: Array<{
    category: string
    totalAchievements: number
    unlockRate: number
    unlockedCount: number
  }>
  topAchievements: Array<{
    name: string
    category: string
    unlockedCount: number
    percentage: number
  }>
  neverUnlocked: {
    count: number
    rate: number
    achievements: Array<{
      id: string
      name: string
      category: string
    }>
  }
  recentActivity: {
    unlocks: number
    activeUsers: number
  }
  alerts: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
  }>
  healthScore: {
    score: number
    status: string
    level: 'excellent' | 'good' | 'warning' | 'critical'
  }
}

export default function AdminAchievements() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchHealthData()
    }
  }, [status, router])

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/achievements/health')
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados de saúde')
      }
      
      const data = await response.json()
      setHealthData(data)
    } catch (error) {
      console.error('Error fetching health data:', error)
      setError('Erro ao carregar dados de monitoramento')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-yellow-400'
      case 'warning': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getScoreBg = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500/20 border-green-500/40'
      case 'good': return 'bg-yellow-500/20 border-yellow-500/40'
      case 'warning': return 'bg-orange-500/20 border-orange-500/40'
      case 'critical': return 'bg-red-500/20 border-red-500/40'
      default: return 'bg-gray-500/20 border-gray-500/40'
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500/20 border-red-500/40 text-red-300'
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
      case 'info': return 'bg-blue-500/20 border-blue-500/40 text-blue-300'
      default: return 'bg-gray-500/20 border-gray-500/40 text-gray-300'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-4">Erro</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchHealthData}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">🏅 Sistema de Conquistas</h1>
              <p className="text-gray-300">Monitoramento e análise de saúde</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchHealthData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
              >
                🔄 Atualizar
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
              >
                ← Voltar
              </Link>
            </div>
          </div>
          
          {healthData && (
            <div className="text-sm text-gray-400">
              Última atualização: {new Date(healthData.timestamp).toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {healthData && (
          <>
            {/* Health Score */}
            <div className={`rounded-xl p-6 border-2 mb-8 ${getScoreBg(healthData.healthScore.level)}`}>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(healthData.healthScore.level)}`}>
                  {healthData.healthScore.score}/100
                </div>
                <div className="text-2xl font-semibold text-white mb-2">
                  {healthData.healthScore.status}
                </div>
                <div className="text-gray-300">Score de Saúde do Sistema</div>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
                <div className="text-3xl font-bold text-blue-400">{healthData.overview.totalAchievements}</div>
                <div className="text-sm text-gray-300">Total de Conquistas</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
                <div className="text-3xl font-bold text-green-400">{healthData.overview.activeAchievements}</div>
                <div className="text-sm text-gray-300">Conquistas Ativas</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
                <div className="text-3xl font-bold text-purple-400">{healthData.overview.totalUsers}</div>
                <div className="text-sm text-gray-300">Total de Usuários</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
                <div className="text-3xl font-bold text-yellow-400">{healthData.overview.usersWithAchievements}</div>
                <div className="text-sm text-gray-300">Usuários com Conquistas</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
                <div className="text-3xl font-bold text-pink-400">{healthData.overview.engagementRate}%</div>
                <div className="text-sm text-gray-300">Taxa de Engajamento</div>
              </div>
            </div>

            {/* Alerts */}
            {healthData.alerts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">🚨 Alertas</h2>
                <div className="space-y-3">
                  {healthData.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">
                          {alert.type === 'error' ? '🔴' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        {alert.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">⏰ Atividade Recente (24h)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Conquistas desbloqueadas:</span>
                    <span className="text-white font-semibold">{healthData.recentActivity.unlocks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Usuários ativos:</span>
                    <span className="text-white font-semibold">{healthData.recentActivity.activeUsers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Problemas Identificados</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Conquistas nunca desbloqueadas:</span>
                    <span className="text-red-400 font-semibold">{healthData.neverUnlocked.count} ({healthData.neverUnlocked.rate}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">🏷️ Performance por Categoria</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.categoryStats.map((cat) => (
                  <div key={cat.category} className="bg-white/5 rounded-lg p-4">
                    <div className="text-white font-semibold mb-2">{cat.category}</div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>Total: {cat.totalAchievements} conquistas</div>
                      <div>Taxa de desbloqueio: {cat.unlockRate}%</div>
                      <div>Desbloqueadas: {cat.unlockedCount}</div>
                    </div>
                    <div className="mt-2 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, cat.unlockRate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Achievements */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">🏆 Top 10 Conquistas</h3>
              <div className="space-y-3">
                {healthData.topAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="text-yellow-400 font-bold mr-3">#{index + 1}</div>
                      <div>
                        <div className="text-white font-semibold">{achievement.name}</div>
                        <div className="text-gray-300 text-sm">{achievement.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{achievement.unlockedCount} usuários</div>
                      <div className="text-gray-300 text-sm">{achievement.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Never Unlocked Achievements */}
            {healthData.neverUnlocked.count > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">🚫 Conquistas Problemáticas</h3>
                <p className="text-gray-300 mb-4">
                  {healthData.neverUnlocked.count} conquistas nunca foram desbloqueadas (mostrando até 20):
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {healthData.neverUnlocked.achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="text-white font-semibold text-sm">{achievement.name}</div>
                      <div className="text-red-300 text-xs">{achievement.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}