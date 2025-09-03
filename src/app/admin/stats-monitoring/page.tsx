'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'

interface MonitoringStatus {
  currentStatus: {
    timestamp: string
    inconsistenciesFound: number
    autoFixedUsers: number
    criticalErrors: number
    healthStatus: 'healthy' | 'warning' | 'critical'
  } | null
  integrityReport: {
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    successRate: number
    topErrors: Array<{ error: string, count: number }>
    operationsBySource: Array<{ source: string, count: number, successRate: number }>
  }
  monitoringActive: boolean
}

interface Inconsistency {
  userId: string
  userName: string | null
  userEmail: string | null
  currentStats: {
    totalPacksOpened: number
    totalItemsCollected: number
  }
  actualData: {
    packOpenings: number
    itemsInInventory: number
  }
  difference: {
    packsDiff: number
    itemsDiff: number
  }
}

interface XPInconsistency {
  userId: string
  userName: string | null
  userEmail: string | null
  correctXP: number
  storedXP: number
  xpDifference: number
  missingAchievements: string[]
  unlockedAchievements: string[]
}

export default function StatsMonitoring() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, isSuperAdmin, loading } = useAdmin()
  
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null)
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([])
  const [xpInconsistencies, setXpInconsistencies] = useState<XPInconsistency[]>([])
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingInconsistencies, setLoadingInconsistencies] = useState(false)
  const [fixingUsers, setFixingUsers] = useState<Set<string>>(new Set())
  const [fixingAll, setFixingAll] = useState(false)
  const [runningCheck, setRunningCheck] = useState(false)
  const [activeTab, setActiveTab] = useState<'stats' | 'xp'>('stats')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated' && !loading && !isAdmin) {
      router.push('/dashboard')
      return
    }

    if (status === 'authenticated' && isAdmin) {
      fetchMonitoringStatus()
    }
  }, [status, isAdmin, loading, router])

  const fetchMonitoringStatus = async () => {
    try {
      setLoadingStatus(true)
      const response = await fetch('/api/admin/stats-monitoring?action=status')
      if (response.ok) {
        const data = await response.json()
        setMonitoringStatus(data)
      } else {
        showMessage('error', 'Erro ao carregar status do monitoramento')
      }
    } catch (error) {
      console.error('Error fetching monitoring status:', error)
      showMessage('error', 'Erro ao conectar com o servidor')
    } finally {
      setLoadingStatus(false)
    }
  }

  const checkInconsistencies = async () => {
    try {
      setLoadingInconsistencies(true)
      const response = await fetch('/api/admin/validate-stats?action=check')
      if (response.ok) {
        const data = await response.json()
        setInconsistencies(data.inconsistencies || [])
        setXpInconsistencies(data.xpInconsistencies || [])
        const totalIssues = (data.count || 0) + (data.xpCount || 0)
        showMessage('info', `${totalIssues} inconsistências encontradas (${data.count || 0} stats, ${data.xpCount || 0} XP)`)
      } else {
        showMessage('error', 'Erro ao verificar inconsistências')
      }
    } catch (error) {
      console.error('Error checking inconsistencies:', error)
      showMessage('error', 'Erro ao verificar inconsistências')
    } finally {
      setLoadingInconsistencies(false)
    }
  }

  const fixUserStats = async (userId: string) => {
    try {
      setFixingUsers(prev => new Set(prev).add(userId))
      const response = await fetch(`/api/admin/validate-stats?action=fix-user&userId=${userId}&type=stats`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showMessage('success', 'Estatísticas do usuário corrigidas')
          // Remove da lista de inconsistências
          setInconsistencies(prev => prev.filter(inc => inc.userId !== userId))
        } else {
          showMessage('error', 'Falha ao corrigir estatísticas do usuário')
        }
      }
    } catch (error) {
      console.error('Error fixing user stats:', error)
      showMessage('error', 'Erro ao corrigir estatísticas')
    } finally {
      setFixingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const fixUserXP = async (userId: string) => {
    try {
      setFixingUsers(prev => new Set(prev).add(userId))
      const response = await fetch(`/api/admin/validate-stats?action=fix-user&userId=${userId}&type=xp`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showMessage('success', 'XP e conquistas do usuário corrigidas')
          // Remover da lista de inconsistências de XP
          setXpInconsistencies(prev => prev.filter(inc => inc.userId !== userId))
        } else {
          showMessage('error', 'Falha ao corrigir XP do usuário')
        }
      }
    } catch (error) {
      console.error('Error fixing user XP:', error)
      showMessage('error', 'Erro ao corrigir XP')
    } finally {
      setFixingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const fixAllInconsistencies = async () => {
    try {
      setFixingAll(true)
      const response = await fetch('/api/admin/validate-stats?action=fix')
      if (response.ok) {
        const data = await response.json()
        showMessage('success', `${data.fixed} usuários corrigidos, ${data.failed} falharam`)
        setInconsistencies([])
        await fetchMonitoringStatus()
      } else {
        showMessage('error', 'Erro ao corrigir inconsistências')
      }
    } catch (error) {
      console.error('Error fixing all inconsistencies:', error)
      showMessage('error', 'Erro ao corrigir inconsistências')
    } finally {
      setFixingAll(false)
    }
  }

  const fixAllXPInconsistencies = async () => {
    try {
      setFixingAll(true)
      const response = await fetch('/api/admin/recalculate-all-xp', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        showMessage('success', `${data.summary.fixedCount} usuários tiveram XP corrigido`)
        setXpInconsistencies([])
        await checkInconsistencies() // Recarregar dados
      } else {
        showMessage('error', 'Erro ao corrigir XP de todos os usuários')
      }
    } catch (error) {
      console.error('Error fixing all XP:', error)
      showMessage('error', 'Erro ao corrigir XP de todos os usuários')
    } finally {
      setFixingAll(false)
    }
  }

  const runManualCheck = async () => {
    try {
      setRunningCheck(true)
      const response = await fetch('/api/admin/stats-monitoring?action=run-check')
      if (response.ok) {
        const data = await response.json()
        showMessage('success', `Verificação concluída: ${data.result.inconsistenciesFound} problemas encontrados`)
        await fetchMonitoringStatus()
      } else {
        showMessage('error', 'Erro ao executar verificação')
      }
    } catch (error) {
      console.error('Error running manual check:', error)
      showMessage('error', 'Erro ao executar verificação')
    } finally {
      setRunningCheck(false)
    }
  }

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-900/30 border-green-500/30'
      case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30'
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-500/30'
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'critical': return '🚨'
      default: return '❓'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Acesso negado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Monitoramento de Estatísticas</h1>
              <p className="text-gray-300">Sistema de integridade e correção automática</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/admin/stats-audit')}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                📋 Auditoria
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ← Voltar ao Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`mx-4 mt-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-400' :
          message.type === 'error' ? 'bg-red-900/30 border border-red-500/30 text-red-400' :
          'bg-blue-900/30 border border-blue-500/30 text-blue-400'
        }`}>
          {message.text}
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Status Overview */}
        <div className="mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* System Health */}
            <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <span className="mr-3">🏥</span>
                Status do Sistema
              </h3>
              {loadingStatus ? (
                <div className="text-gray-400">Carregando...</div>
              ) : monitoringStatus?.currentStatus ? (
                <div className={`p-4 rounded-lg ${getStatusColor(monitoringStatus.currentStatus.healthStatus)}`}>
                  <div className="text-xl font-bold flex items-center">
                    {getStatusIcon(monitoringStatus.currentStatus.healthStatus)}
                    <span className="ml-2 capitalize">{monitoringStatus.currentStatus.healthStatus}</span>
                  </div>
                  <div className="text-sm mt-2">
                    Última verificação: {new Date(monitoringStatus.currentStatus.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-yellow-400">Nenhum dado disponível</div>
              )}
            </div>

            {/* Operations Stats */}
            <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <span className="mr-3">📊</span>
                Operações (24h)
              </h3>
              {loadingStatus ? (
                <div className="text-gray-400">Carregando...</div>
              ) : monitoringStatus?.integrityReport ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-white font-bold">{monitoringStatus.integrityReport.totalOperations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Sucessos:</span>
                    <span className="text-green-400 font-bold">{monitoringStatus.integrityReport.successfulOperations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Falhas:</span>
                    <span className="text-red-400 font-bold">{monitoringStatus.integrityReport.failedOperations}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-gray-300">Taxa de Sucesso:</span>
                    <span className="text-white font-bold">{monitoringStatus.integrityReport.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-yellow-400">Nenhum dado disponível</div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <span className="mr-3">⚡</span>
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                <button
                  onClick={runManualCheck}
                  disabled={runningCheck}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {runningCheck ? 'Executando...' : '🔍 Executar Verificação'}
                </button>
                <button
                  onClick={checkInconsistencies}
                  disabled={loadingInconsistencies}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loadingInconsistencies ? 'Verificando...' : '🔎 Verificar Inconsistências'}
                </button>
                <button
                  onClick={fetchMonitoringStatus}
                  disabled={loadingStatus}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loadingStatus ? 'Carregando...' : '🔄 Atualizar Status'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inconsistencies List */}
        <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="mr-3">⚠️</span>
              Inconsistências Detectadas
            </h3>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-4 border-b border-gray-600">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'stats'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                📊 Estatísticas ({inconsistencies.length})
              </button>
              <button
                onClick={() => setActiveTab('xp')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'xp'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                🏆 XP e Conquistas ({xpInconsistencies.length})
              </button>
            </div>
          </div>

          {/* Fix All Button */}
          <div className="mb-6">
            {activeTab === 'stats' && inconsistencies.length > 0 && (
              <button
                onClick={fixAllInconsistencies}
                disabled={fixingAll}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {fixingAll ? 'Corrigindo Todos...' : `🔧 Corrigir Todos Stats (${inconsistencies.length})`}
              </button>
            )}
            {activeTab === 'xp' && (
              <button
                onClick={fixAllXPInconsistencies}
                disabled={fixingAll}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {fixingAll ? 'Recalculando XP...' : `🏆 Recalcular XP de Todos Usuários`}
              </button>
            )}
          </div>

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <>
              {inconsistencies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-green-400 text-lg font-semibold">Nenhuma inconsistência de stats encontrada!</p>
                  <p className="text-gray-400 mt-2">Todas as estatísticas estão sincronizadas corretamente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inconsistencies.map((inconsistency) => (
                    <div key={inconsistency.userId} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {inconsistency.userName || 'Usuário sem nome'}
                          </div>
                          <div className="text-gray-300 text-sm">
                            {inconsistency.userEmail} • {inconsistency.userId.substring(0, 8)}...
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-red-400">Stats atuais:</span>
                              <div className="text-white">
                                {inconsistency.currentStats.totalPacksOpened} pacotes, {inconsistency.currentStats.totalItemsCollected} itens
                              </div>
                            </div>
                            <div>
                              <span className="text-green-400">Dados reais:</span>
                              <div className="text-white">
                                {inconsistency.actualData.packOpenings} pacotes, {inconsistency.actualData.itemsInInventory} itens
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-yellow-400">
                            Diferenças: +{inconsistency.difference.packsDiff} pacotes, +{inconsistency.difference.itemsDiff} itens
                          </div>
                        </div>
                        <button
                          onClick={() => fixUserStats(inconsistency.userId)}
                          disabled={fixingUsers.has(inconsistency.userId)}
                          className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                          {fixingUsers.has(inconsistency.userId) ? 'Corrigindo...' : '🔧 Corrigir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* XP Tab */}
          {activeTab === 'xp' && (
            <>
              {xpInconsistencies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-green-400 text-lg font-semibold">Nenhuma inconsistência de XP encontrada!</p>
                  <p className="text-gray-400 mt-2">Todas as conquistas e XP estão corretos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {xpInconsistencies.map((inconsistency) => (
                    <div key={inconsistency.userId} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {inconsistency.userName || 'Usuário sem nome'}
                          </div>
                          <div className="text-gray-300 text-sm">
                            {inconsistency.userEmail} • {inconsistency.userId.substring(0, 8)}...
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-green-400">XP correto (conquistas):</span>
                              <div className="text-white">{inconsistency.correctXP} XP</div>
                            </div>
                            <div>
                              <span className="text-red-400">XP armazenado (banco):</span>
                              <div className="text-white">{inconsistency.storedXP} XP</div>
                            </div>
                          </div>
                          {inconsistency.missingAchievements.length > 0 && (
                            <div className="mt-2 text-xs">
                              <span className="text-yellow-400">Conquistas perdidas:</span>
                              <div className="text-white">{inconsistency.missingAchievements.join(', ')}</div>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-yellow-400">
                            Diferença de XP: {inconsistency.xpDifference > 0 ? '+' : ''}{inconsistency.xpDifference}
                          </div>
                        </div>
                        <button
                          onClick={() => fixUserXP(inconsistency.userId)}
                          disabled={fixingUsers.has(inconsistency.userId)}
                          className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                          {fixingUsers.has(inconsistency.userId) ? 'Corrigindo...' : '🏆 Corrigir XP'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}