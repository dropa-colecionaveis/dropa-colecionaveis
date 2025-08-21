'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

type RequestType = 'export' | 'delete' | 'correct' | 'portability'

interface DataRequest {
  id: string
  type: RequestType
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  createdAt: string
  completedAt?: string
  reason?: string
}

export default function DataRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<RequestType>('export')
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<DataRequest[]>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchDataRequests()
    }
  }, [status, router])

  const fetchDataRequests = async () => {
    try {
      const response = await fetch('/api/user/data-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching data requests:', error)
    }
  }

  const handleDataRequest = async (type: RequestType, reason?: string) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/user/data-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          reason: reason || ''
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Solicitação enviada com sucesso! Você receberá um email com mais informações.')
        fetchDataRequests()
        
        if (type === 'export') {
          // For export, we can provide immediate download
          if (data.downloadUrl) {
            window.open(data.downloadUrl, '_blank')
          }
        }
      } else {
        alert(data.error || 'Erro ao processar solicitação. Tente novamente.')
      }
    } catch (error) {
      alert('Erro na comunicação. Tente novamente.')
    } finally {
      setLoading(false)
      setDeleteConfirmation('')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      processing: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      completed: 'bg-green-500/20 text-green-300 border-green-400/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-400/30'
    }
    
    const labels = {
      pending: 'Pendente',
      processing: 'Processando',
      completed: 'Concluída',
      rejected: 'Rejeitada'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getTypeLabel = (type: RequestType) => {
    const labels = {
      export: 'Exportar Dados',
      delete: 'Excluir Dados',
      correct: 'Corrigir Dados',
      portability: 'Portabilidade'
    }
    return labels[type]
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <PublicHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Gerenciamento de Dados Pessoais
          </h1>
          <p className="text-gray-300 text-center mb-8">
            Conforme a LGPD, você tem direitos sobre seus dados pessoais. Use as opções abaixo para exercê-los.
          </p>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center mb-8 bg-gray-800/50 rounded-lg p-2">
            {[
              { key: 'export', label: '📥 Exportar', icon: '📥' },
              { key: 'delete', label: '🗑️ Excluir', icon: '🗑️' },
              { key: 'correct', label: '✏️ Corrigir', icon: '✏️' },
              { key: 'portability', label: '📤 Portabilidade', icon: '📤' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as RequestType)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content based on active tab */}
          <div className="bg-gray-800/30 rounded-lg p-6 mb-8">
            {activeTab === 'export' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">📥 Exportar Meus Dados</h3>
                <p className="text-gray-300 mb-6">
                  Baixe uma cópia de todos os seus dados pessoais armazenados em nossa plataforma.
                  O arquivo incluirá: perfil, transações, histórico de atividades e preferências.
                </p>
                <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4 mb-6">
                  <h4 className="text-blue-300 font-semibold mb-2">📋 O que será incluído:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Informações do perfil (nome, email, preferências)</li>
                    <li>• Histórico de transações e compras</li>
                    <li>• Itens colecionáveis e inventário</li>
                    <li>• Logs de atividade e estatísticas</li>
                    <li>• Configurações de privacidade</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleDataRequest('export')}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Baixar Meus Dados'}
                </button>
              </div>
            )}

            {activeTab === 'delete' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">🗑️ Excluir Minha Conta</h3>
                <div className="bg-red-600/20 border border-red-400/30 rounded-lg p-4 mb-6">
                  <h4 className="text-red-300 font-semibold mb-2">⚠️ Atenção: Esta ação é irreversível</h4>
                  <p className="text-gray-300 text-sm">
                    Ao solicitar a exclusão, todos os seus dados serão permanentemente removidos, incluindo:
                  </p>
                  <ul className="text-gray-300 text-sm mt-2 space-y-1">
                    <li>• Conta de usuário e perfil</li>
                    <li>• Todos os itens colecionáveis</li>
                    <li>• Histórico de transações (exceto obrigações legais)</li>
                    <li>• Estatísticas e rankings</li>
                  </ul>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">
                    Para confirmar, digite "EXCLUIR MINHA CONTA":
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Digite a confirmação..."
                  />
                </div>
                <button
                  onClick={() => handleDataRequest('delete', 'Solicitação de exclusão de conta do usuário')}
                  disabled={loading || deleteConfirmation !== 'EXCLUIR MINHA CONTA'}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Solicitar Exclusão da Conta'}
                </button>
              </div>
            )}

            {activeTab === 'correct' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">✏️ Corrigir Meus Dados</h3>
                <p className="text-gray-300 mb-6">
                  Solicite a correção de dados incompletos, inexatos ou desatualizados.
                  Nossa equipe analisará sua solicitação e fará as correções necessárias.
                </p>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">
                    Descreva quais dados precisam ser corrigidos:
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Ex: Meu nome está incorreto, deveria ser... / Meu email não está atualizado..."
                    id="correction-reason"
                  />
                </div>
                <button
                  onClick={() => {
                    const reason = (document.getElementById('correction-reason') as HTMLTextAreaElement)?.value
                    if (reason.trim()) {
                      handleDataRequest('correct', reason)
                    } else {
                      alert('Por favor, descreva quais dados precisam ser corrigidos.')
                    }
                  }}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Solicitar Correção'}
                </button>
              </div>
            )}

            {activeTab === 'portability' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">📤 Portabilidade de Dados</h3>
                <p className="text-gray-300 mb-6">
                  Solicite a transferência dos seus dados para outro serviço ou controlador.
                  Forneceremos seus dados em formato estruturado e legível por máquina.
                </p>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">
                    Para onde você gostaria de transferir seus dados?
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da empresa ou serviço de destino"
                    id="portability-destination"
                  />
                </div>
                <button
                  onClick={() => {
                    const destination = (document.getElementById('portability-destination') as HTMLInputElement)?.value
                    if (destination.trim()) {
                      handleDataRequest('portability', `Transferência solicitada para: ${destination}`)
                    } else {
                      alert('Por favor, informe o destino da transferência.')
                    }
                  }}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Solicitar Portabilidade'}
                </button>
              </div>
            )}
          </div>

          {/* Request History */}
          {requests.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">📋 Histórico de Solicitações</h3>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{getTypeLabel(request.type)}</h4>
                        <p className="text-gray-400 text-sm">
                          Solicitado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        {request.completedAt && (
                          <p className="text-gray-400 text-sm">
                            Concluído em: {new Date(request.completedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {request.reason && (
                          <p className="text-gray-300 text-sm mt-2">Motivo: {request.reason}</p>
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Information */}
          <div className="mt-8 pt-6 border-t border-gray-600">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">ℹ️ Informações Importantes</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Solicitações são processadas em até 15 dias úteis</li>
                <li>• Você receberá um email de confirmação para cada solicitação</li>
                <li>• Dados podem ser mantidos por obrigações legais mesmo após exclusão</li>
                <li>• Entre em contato conosco em privacidade@colecionaveis.com para dúvidas</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}