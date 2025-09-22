'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Payment {
  id: string
  externalId: string
  status: string
  method: string
  amount: number
  credits: number
  createdAt: string
  approvedAt?: string
  failedAt?: string
  failureReason?: string
  statusText: string
  statusColor: string
}

export default function PaymentHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchPaymentHistory()
    }
  }, [status])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/payments')
      const data = await response.json()

      if (data.success) {
        setPayments(data.payments)
      } else {
        setError('Erro ao carregar histórico de pagamentos')
      }
    } catch (error) {
      setError('Erro ao carregar histórico de pagamentos')
      console.error('Error fetching payment history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (payment: Payment) => {
    const colorClasses = {
      yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
      green: 'bg-green-500/20 text-green-300 border-green-400',
      red: 'bg-red-500/20 text-red-300 border-red-400',
      blue: 'bg-blue-500/20 text-blue-300 border-blue-400',
      gray: 'bg-gray-500/20 text-gray-300 border-gray-400'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs border ${colorClasses[payment.statusColor as keyof typeof colorClasses]}`}>
        {payment.statusText}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getMethodText = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
        return 'Cartão de Crédito'
      case 'PIX':
        return 'PIX'
      default:
        return method
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Carregando histórico de pagamentos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Histórico de Pagamentos
            </h1>
            <p className="text-gray-300">
              Acompanhe o status das suas compras de créditos
            </p>
          </div>

          {/* Refresh Button */}
          <div className="mb-6">
            <button
              onClick={fetchPaymentHistory}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Atualizar Status'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Payments Table */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            {payments.length === 0 ? (
              <div className="text-center py-12 text-gray-300">
                <p className="text-lg">Nenhum pagamento encontrado</p>
                <p className="text-sm mt-2">Suas compras de créditos aparecerão aqui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Créditos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {getMethodText(payment.method)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          R$ {payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {payment.credits} créditos
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(payment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                          {payment.externalId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status Legend */}
          <div className="mt-6 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Status dos Pagamentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded text-xs border bg-yellow-500/20 text-yellow-300 border-yellow-400">
                  Processando
                </span>
                <span className="text-gray-300">Aguardando confirmação</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded text-xs border bg-green-500/20 text-green-300 border-green-400">
                  Aprovado
                </span>
                <span className="text-gray-300">Créditos adicionados</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded text-xs border bg-red-500/20 text-red-300 border-red-400">
                  Recusado
                </span>
                <span className="text-gray-300">Pagamento não aprovado</span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <button
              onClick={() => router.push('/credits/purchase')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
            >
              Comprar Mais Créditos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}