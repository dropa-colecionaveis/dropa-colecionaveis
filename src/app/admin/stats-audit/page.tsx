'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'

interface AuditEntry {
  id: string
  user_id: string
  action: string
  before_state: any
  after_state: any
  metadata: any
  source: string
  success: boolean
  error: string | null
  timestamp: string
}

interface IntegrityReport {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  successRate: number
  topErrors: Array<{ error: string, count: number }>
  operationsBySource: Array<{ source: string, count: number, successRate: number }>
}

export default function StatsAudit() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, isSuperAdmin, loading } = useAdmin()
  
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([])
  const [failedOperations, setFailedOperations] = useState<AuditEntry[]>([])
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [loading3, setLoading3] = useState(false)
  const [timeRange, setTimeRange] = useState<number>(24)

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
      fetchIntegrityReport()
      fetchFailedOperations()
    }
  }, [status, isAdmin, loading, router])

  const fetchIntegrityReport = async () => {
    try {
      setLoading1(true)
      const response = await fetch(`/api/admin/stats-monitoring?action=status`)
      if (response.ok) {
        const data = await response.json()
        setIntegrityReport(data.integrityReport)
      }
    } catch (error) {
      console.error('Error fetching integrity report:', error)
    } finally {
      setLoading1(false)
    }
  }

  const fetchFailedOperations = async () => {
    try {
      setLoading2(true)
      const response = await fetch(`/api/admin/stats-monitoring?action=audit-history&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setFailedOperations(data.failedOperations || [])
      }
    } catch (error) {
      console.error('Error fetching failed operations:', error)
    } finally {
      setLoading2(false)
    }
  }

  const fetchUserAuditHistory = async () => {
    if (!selectedUser.trim()) return

    try {
      setLoading3(true)
      const response = await fetch(`/api/admin/stats-monitoring?action=audit-history&userId=${selectedUser}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setAuditHistory(data.userHistory || [])
      }
    } catch (error) {
      console.error('Error fetching user audit history:', error)
    } finally {
      setLoading3(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PACK_OPENED': return '📦'
      case 'ITEM_OBTAINED': return '🏆'
      case 'STATS_UPDATED': return '📊'
      case 'STATS_CORRECTED': return '🔧'
      case 'INCONSISTENCY_DETECTED': return '⚠️'
      default: return '📌'
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'FREE_PACK': return 'bg-green-900/30 text-green-400 border-green-500/30'
      case 'REGULAR_PACK': return 'bg-blue-900/30 text-blue-400 border-blue-500/30'
      case 'MARKETPLACE': return 'bg-purple-900/30 text-purple-400 border-purple-500/30'
      case 'AUTOMATIC': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'
      case 'MANUAL': return 'bg-gray-900/30 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-900/30 text-gray-400 border-gray-500/30'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
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
              <h1 className="text-2xl font-bold text-white">Auditoria de Estatísticas</h1>
              <p className="text-gray-300">Histórico detalhado e análise de operações</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/admin/stats-monitoring')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                ← Monitoramento
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ← Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Integrity Report */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3">📈</span>
                Relatório de Integridade (últimas 24h)
              </h3>
              <button
                onClick={fetchIntegrityReport}
                disabled={loading1}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {loading1 ? 'Carregando...' : '🔄 Atualizar'}
              </button>
            </div>

            {integrityReport ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{integrityReport.totalOperations}</div>
                  <div className="text-gray-300">Total de Operações</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{integrityReport.successfulOperations}</div>
                  <div className="text-gray-300">Sucessos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">{integrityReport.failedOperations}</div>
                  <div className="text-gray-300">Falhas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{integrityReport.successRate.toFixed(1)}%</div>
                  <div className="text-gray-300">Taxa de Sucesso</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                {loading1 ? 'Carregando dados...' : 'Nenhum dado disponível'}
              </div>
            )}

            {/* Top Errors */}
            {integrityReport?.topErrors && integrityReport.topErrors.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-4">🚨 Principais Erros</h4>
                <div className="space-y-2">
                  {integrityReport.topErrors.slice(0, 5).map((error, index) => (
                    <div key={index} className="flex justify-between items-center bg-red-900/20 p-3 rounded-lg">
                      <span className="text-red-300 text-sm">{error.error}</span>
                      <span className="text-red-400 font-bold">{error.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operations by Source */}
            {integrityReport?.operationsBySource && integrityReport.operationsBySource.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-4">📊 Operações por Fonte</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrityReport.operationsBySource.map((source, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getSourceColor(source.source)}`}>
                      <div className="font-semibold">{source.source}</div>
                      <div className="text-sm opacity-75">{source.count} operações</div>
                      <div className="text-sm font-bold">{source.successRate.toFixed(1)}% sucesso</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Audit History */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">🔍</span>
              Histórico de Usuário
            </h3>
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                placeholder="ID do usuário (ex: cmexmu4c60000kw04hjco6jb6)"
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500"
              />
              <button
                onClick={fetchUserAuditHistory}
                disabled={loading3}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {loading3 ? 'Buscando...' : '🔍 Buscar'}
              </button>
            </div>

            {auditHistory.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {auditHistory.map((entry, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    entry.success ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/20 border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getActionIcon(entry.action)}</span>
                        <div>
                          <div className={`font-semibold ${entry.success ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.action}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatTimestamp(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg border text-sm ${getSourceColor(entry.source)}`}>
                        {entry.source}
                      </div>
                    </div>
                    {entry.error && (
                      <div className="mt-2 p-2 bg-red-900/30 rounded text-red-300 text-sm">
                        Erro: {entry.error}
                      </div>
                    )}
                    {entry.metadata && (
                      <details className="mt-2">
                        <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                          Ver detalhes técnicos
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-900/50 rounded text-xs text-gray-300 overflow-x-auto">
                          {formatJSON(entry.metadata)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-50">🔍</div>
                <p className="text-gray-400">
                  {selectedUser ? 'Nenhum histórico encontrado para este usuário' : 'Digite um ID de usuário para buscar o histórico'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Failed Operations */}
        <div>
          <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3">🚨</span>
                Operações com Falha (últimas 24h)
              </h3>
              <button
                onClick={fetchFailedOperations}
                disabled={loading2}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {loading2 ? 'Carregando...' : '🔄 Atualizar'}
              </button>
            </div>

            {failedOperations.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {failedOperations.map((entry, index) => (
                  <div key={index} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getActionIcon(entry.action)}</span>
                        <div>
                          <div className="text-red-400 font-semibold">{entry.action}</div>
                          <div className="text-gray-400 text-sm">
                            Usuário: {entry.user_id.substring(0, 8)}... • {formatTimestamp(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg border text-sm ${getSourceColor(entry.source)}`}>
                        {entry.source}
                      </div>
                    </div>
                    {entry.error && (
                      <div className="mt-2 p-2 bg-red-900/30 rounded text-red-300 text-sm">
                        <strong>Erro:</strong> {entry.error}
                      </div>
                    )}
                    <details className="mt-2">
                      <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                        Ver detalhes da operação
                      </summary>
                      <div className="mt-2 space-y-2">
                        {entry.before_state && (
                          <div>
                            <div className="text-gray-400 text-xs">Estado Anterior:</div>
                            <pre className="p-2 bg-gray-900/50 rounded text-xs text-gray-300 overflow-x-auto">
                              {formatJSON(entry.before_state)}
                            </pre>
                          </div>
                        )}
                        {entry.after_state && (
                          <div>
                            <div className="text-gray-400 text-xs">Estado Posterior:</div>
                            <pre className="p-2 bg-gray-900/50 rounded text-xs text-gray-300 overflow-x-auto">
                              {formatJSON(entry.after_state)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-green-400 text-lg font-semibold">Nenhuma falha detectada!</p>
                <p className="text-gray-400 mt-2">Todas as operações foram executadas com sucesso nas últimas 24 horas.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}