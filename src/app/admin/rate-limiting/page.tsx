'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RateLimitStats {
  totalViolations: number
  uniqueIPs: number
  blockedIPs: number
  violationsByEndpoint: { [key: string]: number }
  violationsByIP: { ip: string; count: number; lastViolation: string }[]
  recentViolations: RateLimitViolation[]
}

interface RateLimitViolation {
  id: string
  ip: string
  endpoint: string
  method: string
  violations: number
  windowStart: string
  isBlocked: boolean
  userAgent?: string
  timestamp: string
}

interface RateLimitConfig {
  endpoint: string
  limit: number
  windowMs: number
  blockDurationMs: number
}

export default function RateLimitingStats() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<RateLimitStats | null>(null)
  const [violations, setViolations] = useState<RateLimitViolation[]>([])
  const [configs, setConfigs] = useState<RateLimitConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('24h')
  const [showBlocked, setShowBlocked] = useState<boolean>(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/rate-limiting')
    } else if (status === 'authenticated') {
      fetchRateLimitData()
    }
  }, [status, router, timeRange, showBlocked])

  const fetchRateLimitData = async () => {
    try {
      setLoading(true)
      const [statsResponse, violationsResponse, configsResponse] = await Promise.all([
        fetch(`/api/admin/rate-limit-stats?timeRange=${timeRange}`),
        fetch(`/api/admin/rate-limit-violations?timeRange=${timeRange}&blocked=${showBlocked}`),
        fetch('/api/admin/rate-limit-config')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (violationsResponse.ok) {
        const violationsData = await violationsResponse.json()
        setViolations(violationsData.violations || [])
      }

      if (configsResponse.ok) {
        const configsData = await configsResponse.json()
        setConfigs(configsData.configs || [])
      }
    } catch (error) {
      console.error('Error fetching rate limit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblockIP = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/rate-limit-unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      })

      if (response.ok) {
        await fetchRateLimitData()
        alert(`✅ IP ${ip} desbloqueado com sucesso!`)
      } else {
        alert('❌ Erro ao desbloquear IP')
      }
    } catch (error) {
      console.error('Error unblocking IP:', error)
      alert('❌ Erro ao desbloquear IP')
    }
  }

  const handleUpdateConfig = async (endpoint: string, newConfig: Partial<RateLimitConfig>) => {
    try {
      const response = await fetch('/api/admin/rate-limit-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, ...newConfig })
      })

      if (response.ok) {
        await fetchRateLimitData()
        alert('✅ Configuração atualizada com sucesso!')
      } else {
        alert('❌ Erro ao atualizar configuração')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      alert('❌ Erro ao atualizar configuração')
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">⚡ Carregando Estatísticas Rate Limiting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-white font-bold text-xl">
                🎮 <span className="text-purple-300">Admin Panel</span>
              </Link>
              <div className="hidden md:block">
                <div className="text-white font-medium">
                  ⚡ <span className="text-purple-300">Rate Limiting</span>
                </div>
                <div className="text-gray-400 text-sm">Estatísticas e configurações</div>
              </div>
            </div>
            <Link 
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.totalViolations}</div>
              <div className="text-gray-300 text-sm">Total de Violações</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/30">
              <div className="text-3xl font-bold text-orange-400 mb-2">{stats.uniqueIPs}</div>
              <div className="text-gray-300 text-sm">IPs Únicos</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.blockedIPs}</div>
              <div className="text-gray-300 text-sm">IPs Bloqueados</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/30">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {stats.violationsByEndpoint ? Object.keys(stats.violationsByEndpoint).length : 0}
              </div>
              <div className="text-gray-300 text-sm">Endpoints Afetados</div>
            </div>
          </div>
        )}

        {/* Violations by Endpoint */}
        {stats && stats.violationsByEndpoint && Object.keys(stats.violationsByEndpoint).length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">📊 Violações por Endpoint</h3>
            <div className="space-y-3">
              {Object.entries(stats.violationsByEndpoint)
                .sort(([,a], [,b]) => b - a)
                .map(([endpoint, count]) => (
                <div key={endpoint} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white font-mono text-sm">{endpoint}</span>
                  <span className="text-red-400 font-bold">{count} violações</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate Limit Configuration */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">⚙️ Configurações de Rate Limiting</h3>
          <div className="space-y-4">
            {configs.map((config) => (
              <div key={config.endpoint} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                  <div className="flex-1">
                    <div className="text-white font-mono text-sm mb-1">{config.endpoint}</div>
                    <div className="text-gray-400 text-xs">
                      {config.limit} requests por {formatDuration(config.windowMs)} • 
                      Bloqueio: {formatDuration(config.blockDurationMs)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newLimit = prompt('Novo limite de requests:', config.limit.toString())
                      if (newLimit && parseInt(newLimit) > 0) {
                        handleUpdateConfig(config.endpoint, { limit: parseInt(newLimit) })
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    ⚙️ Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Violating IPs */}
        {stats && stats.violationsByIP && stats.violationsByIP.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">🚫 IPs com Mais Violações</h3>
            <div className="space-y-3">
              {stats.violationsByIP.slice(0, 10).map((ipData) => (
                <div key={ipData.ip} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-white font-mono text-sm">{ipData.ip}</div>
                    <div className="text-gray-400 text-xs">
                      Última violação: {new Date(ipData.lastViolation).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400 font-bold">{ipData.count}</span>
                    <button
                      onClick={() => handleUnblockIP(ipData.ip)}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                    >
                      🔓 Desbloquear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Período:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="1h">Última hora</option>
                  <option value="24h">Últimas 24h</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center text-white text-sm">
                  <input
                    type="checkbox"
                    checked={showBlocked}
                    onChange={(e) => setShowBlocked(e.target.checked)}
                    className="mr-2"
                  />
                  Apenas IPs bloqueados
                </label>
              </div>
            </div>
            
            <button
              onClick={fetchRateLimitData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Recent Violations */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">⚡ Violações Recentes</h2>
            <p className="text-gray-300">Monitoramento em tempo real das violações de rate limiting</p>
          </div>
          
          <div className="p-6">
            {violations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4">✅</div>
                <p>Nenhuma violação encontrada no período selecionado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className={`p-4 rounded-lg border backdrop-blur-sm ${
                      violation.isBlocked 
                        ? 'border-red-500/30 bg-red-900/20' 
                        : 'border-orange-500/30 bg-orange-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {violation.isBlocked ? '🚫' : '⚠️'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-white font-mono">{violation.ip}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              violation.isBlocked ? 'text-red-300 bg-red-900/30' : 'text-orange-300 bg-orange-900/30'
                            }`}>
                              {violation.isBlocked ? 'BLOQUEADO' : 'VIOLAÇÃO'}
                            </span>
                          </div>
                          
                          <div className="text-gray-200 space-y-1 text-sm">
                            <div>🎯 Endpoint: <span className="font-mono">{violation.method} {violation.endpoint}</span></div>
                            <div>📊 Violações: {violation.violations}</div>
                            <div>⏰ Janela: {new Date(violation.windowStart).toLocaleString('pt-BR')}</div>
                            {violation.userAgent && (
                              <div>💻 User Agent: {violation.userAgent.substring(0, 60)}...</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-400">
                        <div>{new Date(violation.timestamp).toLocaleString('pt-BR')}</div>
                        {violation.isBlocked && (
                          <button
                            onClick={() => handleUnblockIP(violation.ip)}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            🔓 Desbloquear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}