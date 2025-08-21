'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SecurityEvent {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
  timestamp: string
}

interface SecurityStats {
  totalEvents: number
  criticalEvents: number
  highEvents: number
  blockedIPs: number
  rateLimitViolations: number
  recentEvents: SecurityEvent[]
}

export default function SecurityMonitoring() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('24h')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/security')
    } else if (status === 'authenticated') {
      fetchSecurityData()
    }
  }, [status, router, filter, timeRange])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const [statsResponse, eventsResponse] = await Promise.all([
        fetch('/api/admin/security-stats'),
        fetch(`/api/admin/security-logs?filter=${filter}&timeRange=${timeRange}`)
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData.events || [])
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400 bg-red-900/20 border-red-500/30'
      case 'HIGH': return 'text-orange-400 bg-orange-900/20 border-orange-500/30'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 'LOW': return 'text-green-400 bg-green-900/20 border-green-500/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🚨'
      case 'HIGH': return '⚠️'
      case 'MEDIUM': return '⚡'
      case 'LOW': return '🔍'
      default: return '📋'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">🔐 Carregando Monitoramento de Segurança...</div>
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
                  🔐 <span className="text-purple-300">Monitoramento de Segurança</span>
                </div>
                <div className="text-gray-400 text-sm">Logs e eventos de segurança</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalEvents}</div>
              <div className="text-gray-300 text-sm">Total de Eventos</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.criticalEvents}</div>
              <div className="text-gray-300 text-sm">Eventos Críticos</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/30">
              <div className="text-3xl font-bold text-orange-400 mb-2">{stats.highEvents}</div>
              <div className="text-gray-300 text-sm">Eventos Alta Prioridade</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-yellow-500/30">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.blockedIPs}</div>
              <div className="text-gray-300 text-sm">IPs Bloqueados</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/30">
              <div className="text-3xl font-bold text-purple-400 mb-2">{stats.rateLimitViolations}</div>
              <div className="text-gray-300 text-sm">Violações Rate Limit</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Severidade:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="all">Todos</option>
                  <option value="CRITICAL">Crítico</option>
                  <option value="HIGH">Alto</option>
                  <option value="MEDIUM">Médio</option>
                  <option value="LOW">Baixo</option>
                </select>
              </div>
              
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
            </div>
            
            <button
              onClick={fetchSecurityData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Security Events */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">🔍 Eventos de Segurança</h2>
            <p className="text-gray-300">Monitoramento em tempo real dos eventos de segurança</p>
          </div>
          
          <div className="p-6">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4">🎉</div>
                <p>Nenhum evento de segurança encontrado no período selecionado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(event.severity)} backdrop-blur-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{getSeverityIcon(event.severity)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-white">{event.type}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                              {event.severity}
                            </span>
                          </div>
                          <p className="text-gray-200 mb-2">{event.description}</p>
                          
                          <div className="text-sm text-gray-400 space-y-1">
                            {event.userEmail && (
                              <div>👤 Usuário: {event.userEmail}</div>
                            )}
                            {event.ipAddress && (
                              <div>🌐 IP: {event.ipAddress}</div>
                            )}
                            {event.userAgent && (
                              <div>💻 User Agent: {event.userAgent.substring(0, 50)}...</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-400">
                        <div>{new Date(event.timestamp).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-300 hover:text-white">
                            📋 Metadados
                          </summary>
                          <pre className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-300 overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
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