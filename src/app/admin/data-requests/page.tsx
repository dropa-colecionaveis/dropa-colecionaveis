'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DataRequest {
  id: string
  userId: string
  userEmail: string
  type: 'export' | 'delete' | 'correct' | 'portability'
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestData?: any
  reason?: string
  createdAt: string
  processedAt?: string
  processedBy?: string
}

interface DataRequestStats {
  totalRequests: number
  pendingRequests: number
  completedRequests: number
  rejectedRequests: number
  requestsByType: {
    export: number
    delete: number
    correct: number
    portability: number
  }
}

export default function LGPDDataRequests() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DataRequestStats | null>(null)
  const [requests, setRequests] = useState<DataRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/data-requests')
    } else if (status === 'authenticated') {
      fetchDataRequests()
    }
  }, [status, router, filter, typeFilter])

  const fetchDataRequests = async () => {
    try {
      setLoading(true)
      const [statsResponse, requestsResponse] = await Promise.all([
        fetch('/api/admin/data-requests/stats'),
        fetch(`/api/admin/data-requests?status=${filter}&type=${typeFilter}`)
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setRequests(requestsData.requests || [])
      }
    } catch (error) {
      console.error('Error fetching data requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setProcessingRequest(requestId)
      const response = await fetch(`/api/admin/data-requests/${requestId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })

      if (response.ok) {
        await fetchDataRequests()
        alert(`✅ Solicitação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso!`)
      } else {
        alert('❌ Erro ao processar solicitação')
      }
    } catch (error) {
      console.error('Error processing request:', error)
      alert('❌ Erro ao processar solicitação')
    } finally {
      setProcessingRequest(null)
    }
  }

  const getTypeLabel = (type: string) => {
    const types = {
      export: '📥 Exportar Dados',
      delete: '🗑️ Excluir Dados',
      correct: '✏️ Corrigir Dados',
      portability: '📤 Portabilidade'
    }
    return types[type as keyof typeof types] || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 'processing': return 'text-blue-400 bg-blue-900/20 border-blue-500/30'
      case 'completed': return 'text-green-400 bg-green-900/20 border-green-500/30'
      case 'rejected': return 'text-red-400 bg-red-900/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: string) => {
    const statuses = {
      pending: '⏳ Pendente',
      processing: '⚙️ Processando',
      completed: '✅ Concluída',
      rejected: '❌ Rejeitada'
    }
    return statuses[status as keyof typeof statuses] || status
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">📋 Carregando Solicitações LGPD...</div>
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
                  📋 <span className="text-purple-300">Solicitações LGPD</span>
                </div>
                <div className="text-gray-400 text-sm">Gerenciamento de dados pessoais</div>
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
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalRequests}</div>
              <div className="text-gray-300 text-sm">Total de Solicitações</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-yellow-500/30">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.pendingRequests}</div>
              <div className="text-gray-300 text-sm">Pendentes</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-green-500/30">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.completedRequests}</div>
              <div className="text-gray-300 text-sm">Concluídas</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.rejectedRequests}</div>
              <div className="text-gray-300 text-sm">Rejeitadas</div>
            </div>
          </div>
        )}

        {/* Request Type Statistics */}
        {stats && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">📊 Solicitações por Tipo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.requestsByType.export}</div>
                <div className="text-sm text-gray-300">📥 Exportar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.requestsByType.delete}</div>
                <div className="text-sm text-gray-300">🗑️ Excluir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.requestsByType.correct}</div>
                <div className="text-sm text-gray-300">✏️ Corrigir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.requestsByType.portability}</div>
                <div className="text-sm text-gray-300">📤 Portabilidade</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="processing">Processando</option>
                  <option value="completed">Concluída</option>
                  <option value="rejected">Rejeitada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Tipo:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="all">Todos</option>
                  <option value="export">Exportar</option>
                  <option value="delete">Excluir</option>
                  <option value="correct">Corrigir</option>
                  <option value="portability">Portabilidade</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={fetchDataRequests}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Data Requests */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">📋 Solicitações de Dados</h2>
            <p className="text-gray-300">Gerenciar solicitações de dados pessoais conforme LGPD</p>
          </div>
          
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4">📝</div>
                <p>Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-6 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {request.type === 'export' && '📥'}
                          {request.type === 'delete' && '🗑️'}
                          {request.type === 'correct' && '✏️'}
                          {request.type === 'portability' && '📤'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-white">{getTypeLabel(request.type)}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                              {getStatusLabel(request.status)}
                            </span>
                          </div>
                          <div className="text-gray-300 space-y-1">
                            <div>👤 Usuário: {request.userEmail}</div>
                            <div>📅 Solicitado em: {new Date(request.createdAt).toLocaleString('pt-BR')}</div>
                            {request.processedAt && (
                              <div>✅ Processado em: {new Date(request.processedAt).toLocaleString('pt-BR')}</div>
                            )}
                            {request.reason && (
                              <div className="mt-2 p-2 bg-yellow-900/20 rounded text-yellow-200">
                                💬 Motivo: {request.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleProcessRequest(request.id, 'approve')}
                            disabled={processingRequest === request.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            ✅ Aprovar
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Motivo da rejeição:')
                              if (reason) handleProcessRequest(request.id, 'reject', reason)
                            }}
                            disabled={processingRequest === request.id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            ❌ Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {request.requestData && Object.keys(request.requestData).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-300 hover:text-white">
                            📋 Dados da Solicitação
                          </summary>
                          <pre className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-300 overflow-x-auto">
                            {JSON.stringify(request.requestData, null, 2)}
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