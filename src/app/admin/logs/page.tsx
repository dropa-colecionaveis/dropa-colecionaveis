'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
  service: string
  message: string
  metadata?: any
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  requestId?: string
  duration?: number
  statusCode?: number
  method?: string
  endpoint?: string
}

interface LogStats {
  totalLogs: number
  errorLogs: number
  warningLogs: number
  infoLogs: number
  debugLogs: number
  topServices: { service: string; count: number }[]
  topErrors: { message: string; count: number }[]
}

export default function SecurityLogs() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('24h')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/logs')
    } else if (status === 'authenticated') {
      fetchLogs()
    }
  }, [status, router, levelFilter, serviceFilter, timeRange, searchTerm])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000) // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, levelFilter, serviceFilter, timeRange, searchTerm])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        level: levelFilter,
        service: serviceFilter,
        timeRange,
        search: searchTerm
      })

      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/logs?${params}`),
        fetch('/api/admin/logs/stats')
      ])

      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData.logs || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'FATAL': return 'text-red-400 bg-red-900/20 border-red-500/30'
      case 'ERROR': return 'text-red-400 bg-red-900/20 border-red-500/30'
      case 'WARN': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 'INFO': return 'text-blue-400 bg-blue-900/20 border-blue-500/30'
      case 'DEBUG': return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'FATAL': return '💀'
      case 'ERROR': return '❌'
      case 'WARN': return '⚠️'
      case 'INFO': return 'ℹ️'
      case 'DEBUG': return '🔍'
      default: return '📋'
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'auth': return '🔐'
      case 'payment': return '💳'
      case 'database': return '🗄️'
      case 'api': return '🔗'
      case 'security': return '🛡️'
      case 'email': return '📧'
      case 'rate-limit': return '⚡'
      default: return '⚙️'
    }
  }

  const downloadLogs = async () => {
    try {
      const params = new URLSearchParams({
        level: levelFilter,
        service: serviceFilter,
        timeRange,
        search: searchTerm,
        export: 'true'
      })

      const response = await fetch(`/api/admin/logs/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading logs:', error)
      alert('❌ Erro ao baixar logs')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">📋 Carregando Logs de Segurança...</div>
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
                  📋 <span className="text-purple-300">Logs de Segurança</span>
                </div>
                <div className="text-gray-400 text-sm">Visualização e análise de logs do sistema</div>
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
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalLogs}</div>
              <div className="text-gray-300 text-sm">Total de Logs</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.errorLogs}</div>
              <div className="text-gray-300 text-sm">Erros</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-yellow-500/30">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.warningLogs}</div>
              <div className="text-gray-300 text-sm">Avisos</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-blue-500/30">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.infoLogs}</div>
              <div className="text-gray-300 text-sm">Informações</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-gray-500/30">
              <div className="text-3xl font-bold text-gray-400 mb-2">{stats.debugLogs}</div>
              <div className="text-gray-300 text-sm">Debug</div>
            </div>
          </div>
        )}

        {/* Top Services and Errors */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">📊 Top Serviços</h3>
              <div className="space-y-2">
                {stats.topServices.slice(0, 5).map((service, index) => (
                  <div key={service.service} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <div className="flex items-center space-x-2">
                      <span>{getServiceIcon(service.service)}</span>
                      <span className="text-white">{service.service}</span>
                    </div>
                    <span className="text-blue-400 font-semibold">{service.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">🚨 Top Erros</h3>
              <div className="space-y-2">
                {stats.topErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="p-2 bg-white/5 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-red-400 font-semibold">{error.count}x</span>
                    </div>
                    <div className="text-sm text-gray-300 truncate">{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Nível:</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="FATAL">Fatal</option>
                <option value="ERROR">Erro</option>
                <option value="WARN">Aviso</option>
                <option value="INFO">Info</option>
                <option value="DEBUG">Debug</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Serviço:</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="auth">Auth</option>
                <option value="payment">Payment</option>
                <option value="database">Database</option>
                <option value="api">API</option>
                <option value="security">Security</option>
                <option value="email">Email</option>
                <option value="rate-limit">Rate Limit</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Período:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
              >
                <option value="1h">Última hora</option>
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Buscar:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar logs..."
                className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="flex items-center text-white text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh (10s)
              </label>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={downloadLogs}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                📥 Exportar
              </button>
              <button
                onClick={fetchLogs}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">📋 Logs do Sistema</h2>
            <p className="text-gray-300">Visualização em tempo real dos logs de segurança e sistema</p>
          </div>
          
          <div className="p-6">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4">📋</div>
                <p>Nenhum log encontrado com os filtros selecionados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${getLevelColor(log.level)} backdrop-blur-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="text-xl">{getLevelIcon(log.level)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                              {log.level}
                            </span>
                            <span className="text-white font-mono text-sm">{log.service}</span>
                            {log.requestId && (
                              <span className="text-gray-400 text-xs font-mono">
                                {log.requestId.substring(0, 8)}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-200 mb-2 break-words">{log.message}</p>
                          
                          <div className="text-xs text-gray-400 space-y-1">
                            {log.userEmail && (
                              <div>👤 {log.userEmail}</div>
                            )}
                            {log.ipAddress && (
                              <div>🌐 {log.ipAddress}</div>
                            )}
                            {log.method && log.endpoint && (
                              <div>🎯 {log.method} {log.endpoint}</div>
                            )}
                            {log.statusCode && (
                              <div>📊 Status: {log.statusCode}</div>
                            )}
                            {log.duration && (
                              <div>⏱️ {log.duration}ms</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-gray-400 ml-4">
                        <div>{new Date(log.timestamp).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                    
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-300 hover:text-white">
                            📋 Metadados
                          </summary>
                          <pre className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-300 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
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