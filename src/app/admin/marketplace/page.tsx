'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'

interface MarketplaceStats {
  totalActiveListings: number
  totalCompletedTransactions: number
  totalMarketplaceVolume: number
  totalMarketplaceFees: number
  averageItemPrice: number
  topSellersByVolume: Array<{
    userId: string
    name: string
    email: string
    totalSales: number
    totalVolume: number
  }>
  recentTransactions: Array<{
    id: string
    itemName: string
    price: number
    buyerName: string
    sellerName: string
    createdAt: string
    status: string
  }>
}

interface AntiFreudStats {
  todayListings: number
  todayTransactions: number
  highValueTransactions: number
  suspiciousUsers: number
  suspiciousUsersList: Array<{
    id: string
    name: string
    email: string
    listings: number
    purchases: number
  }>
}

interface MarketplaceRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  configuration: any
  category: string
}

export default function AdminMarketplace() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats | null>(null)
  const [antiFraudStats, setAntiFraudStats] = useState<AntiFreudStats | null>(null)
  const [rules, setRules] = useState<MarketplaceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'antifraud' | 'rules' | 'transactions'>('overview')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [userAnalysis, setUserAnalysis] = useState<any>(null)
  const [loadingUserAnalysis, setLoadingUserAnalysis] = useState(false)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [ruleChanges, setRuleChanges] = useState<Record<string, any>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/marketplace')
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
      setLoading(true)
      const [marketplaceResponse, antiFraudResponse, rulesResponse] = await Promise.all([
        fetch('/api/admin/marketplace'),
        fetch('/api/admin/anti-fraud?action=stats'),
        fetch('/api/admin/marketplace/rules')
      ])

      if (marketplaceResponse.ok) {
        const marketplaceData = await marketplaceResponse.json()
        setMarketplaceStats(marketplaceData)
      }

      if (antiFraudResponse.ok) {
        const antiFraudData = await antiFraudResponse.json()
        // Map the API response to match the expected interface
        const mappedData = {
          todayListings: antiFraudData.stats?.todayListings || 0,
          todayTransactions: antiFraudData.stats?.todayTransactions || 0,
          highValueTransactions: antiFraudData.stats?.highValueTransactions || 0,
          suspiciousUsers: antiFraudData.stats?.suspiciousUsers || 0,
          suspiciousUsersList: antiFraudData.suspiciousUsers || []
        }
        setAntiFraudStats(mappedData)
      }

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        setRules(rulesData.rules)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeUser = async (userId: string) => {
    if (!userId) return
    
    setLoadingUserAnalysis(true)
    try {
      const response = await fetch(`/api/admin/anti-fraud?action=user-activity&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserAnalysis(data)
      }
    } catch (error) {
      console.error('Error analyzing user:', error)
    } finally {
      setLoadingUserAnalysis(false)
    }
  }

  const flagUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/anti-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flag-user',
          userId,
          reason
        })
      })

      if (response.ok) {
        alert('Usuário marcado com sucesso')
        fetchStats() // Refresh stats
      } else {
        const error = await response.json()
        alert(`Erro: ${error.message}`)
      }
    } catch (error) {
      console.error('Error flagging user:', error)
      alert('Erro interno')
    }
  }

  const cancelListing = async (listingId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/anti-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-listing',
          listingId,
          reason
        })
      })

      if (response.ok) {
        alert('Listagem cancelada com sucesso')
        fetchStats() // Refresh stats
      } else {
        const error = await response.json()
        alert(`Erro: ${error.message}`)
      }
    } catch (error) {
      console.error('Error cancelling listing:', error)
      alert('Erro interno')
    }
  }

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/marketplace/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId,
          isActive
        })
      })

      if (response.ok) {
        // Update local state
        setRules(prevRules => 
          prevRules.map(rule => 
            rule.id === ruleId ? { ...rule, isActive } : rule
          )
        )
        alert(`Regra ${isActive ? 'ativada' : 'desativada'} com sucesso`)
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
      alert('Erro interno')
    }
  }

  const startEditingRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule) {
      setEditingRule(ruleId)
      setRuleChanges({ [ruleId]: { ...rule.configuration } })
    }
  }

  const cancelEditingRule = () => {
    setEditingRule(null)
    setRuleChanges({})
  }

  const saveRuleChanges = async (ruleId: string) => {
    try {
      const configuration = ruleChanges[ruleId]
      const response = await fetch('/api/admin/marketplace/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId,
          configuration
        })
      })

      if (response.ok) {
        // Update local state
        setRules(prevRules => 
          prevRules.map(rule => 
            rule.id === ruleId ? { ...rule, configuration } : rule
          )
        )
        setEditingRule(null)
        setRuleChanges({})
        alert('Configuração da regra salva com sucesso')
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving rule changes:', error)
      alert('Erro interno')
    }
  }

  const updateRuleConfig = (ruleId: string, field: string, value: any) => {
    setRuleChanges(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value
      }
    }))
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'security': 'bg-red-500/20 border-red-500/30 text-red-400',
      'pricing': 'bg-green-500/20 border-green-500/30 text-green-400',
      'limits': 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      'validation': 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      'anti-fraud': 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      'other': 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    }
    return colors[category] || colors['other']
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
          <Link href="/admin" className="text-2xl font-bold text-white">
            Admin Marketplace
          </Link>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Gerenciamento do Marketplace</h1>
            <p className="text-gray-300">
              Monitore transações, detecte fraudes e gerencie regras
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {[
              { id: 'overview', label: 'Visão Geral', icon: '📊' },
              { id: 'antifraud', label: 'Anti-Fraude', icon: '🔒' },
              { id: 'rules', label: 'Regras', icon: '⚖️' },
              { id: 'transactions', label: 'Transações', icon: '💰' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && marketplaceStats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-blue-400">{marketplaceStats.totalActiveListings}</div>
                  <div className="text-sm text-gray-300">Listagens Ativas</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-green-400">{marketplaceStats.totalCompletedTransactions}</div>
                  <div className="text-sm text-gray-300">Transações</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-purple-400">{marketplaceStats.totalMarketplaceVolume}</div>
                  <div className="text-sm text-gray-300">Volume Total</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-yellow-400">{marketplaceStats.totalMarketplaceFees}</div>
                  <div className="text-sm text-gray-300">Taxas Arrecadadas</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-orange-400">{marketplaceStats.averageItemPrice}</div>
                  <div className="text-sm text-gray-300">Preço Médio</div>
                </div>
              </div>

              {/* Top Sellers */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">🏆 Top Vendedores</h3>
                <div className="space-y-3">
                  {marketplaceStats.topSellersByVolume.map((seller, index) => (
                    <div key={seller.userId} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-yellow-400 font-bold">#{index + 1}</span>
                        <div>
                          <div className="text-white font-medium">{seller.name || seller.email}</div>
                          <div className="text-gray-400 text-sm">{seller.totalSales} vendas</div>
                        </div>
                      </div>
                      <div className="text-green-400 font-bold">
                        {seller.totalVolume} créditos
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Anti-Fraud Tab */}
          {activeTab === 'antifraud' && antiFraudStats && (
            <div className="space-y-6">
              {/* Anti-Fraud Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-blue-400">{antiFraudStats?.todayListings || 0}</div>
                  <div className="text-sm text-gray-300">Listagens Hoje</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-green-400">{antiFraudStats?.todayTransactions || 0}</div>
                  <div className="text-sm text-gray-300">Transações Hoje</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-orange-400">{antiFraudStats?.highValueTransactions || 0}</div>
                  <div className="text-sm text-gray-300">Alto Valor (Semana)</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center text-white">
                  <div className="text-2xl font-bold text-red-400">{antiFraudStats?.suspiciousUsers || 0}</div>
                  <div className="text-sm text-gray-300">Usuários Suspeitos</div>
                </div>
              </div>

              {/* Suspicious Users */}
              {antiFraudStats?.suspiciousUsersList && antiFraudStats.suspiciousUsersList.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">⚠️ Usuários com Atividade Suspeita</h3>
                  <div className="space-y-3">
                    {antiFraudStats.suspiciousUsersList.map((user) => (
                      <div key={user.id} className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <div>
                          <div className="text-white font-medium">{user.name || user.email}</div>
                          <div className="text-gray-400 text-sm">
                            {user.listings} listagens • {user.purchases} compras hoje
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => analyzeUser(user.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            Analisar
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Motivo para marcar este usuário:')
                              if (reason) flagUser(user.id, reason)
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Marcar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Analysis */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">🔍 Análise de Usuário</h3>
                <div className="flex space-x-4 mb-4">
                  <input
                    type="text"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    placeholder="ID do usuário para analisar..."
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                  <button
                    onClick={() => analyzeUser(selectedUser)}
                    disabled={loadingUserAnalysis}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg"
                  >
                    {loadingUserAnalysis ? 'Analisando...' : 'Analisar'}
                  </button>
                </div>

                {userAnalysis && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm text-gray-300">Atividade Semanal</div>
                        <div className="text-white font-medium">
                          {userAnalysis?.weeklyActivity?.listings || 0} listagens • {userAnalysis?.weeklyActivity?.purchases || 0} compras
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm text-gray-300">Nível de Risco</div>
                        <div className={`font-medium ${
                          userAnalysis?.suspiciousActivity?.riskLevel === 'HIGH' ? 'text-red-400' :
                          userAnalysis?.suspiciousActivity?.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {userAnalysis?.suspiciousActivity?.riskLevel || 'UNKNOWN'}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-sm text-gray-300">Pode Listar</div>
                        <div className={`font-medium ${userAnalysis?.listingLimits?.canList ? 'text-green-400' : 'text-red-400'}`}>
                          {userAnalysis?.listingLimits?.canList ? 'Sim' : 'Não'}
                        </div>
                      </div>
                    </div>

                    {userAnalysis?.suspiciousActivity?.reasons && userAnalysis.suspiciousActivity.reasons.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <div className="text-red-400 font-medium mb-2">Motivos de Suspeita:</div>
                        <ul className="text-red-300 text-sm space-y-1">
                          {userAnalysis?.suspiciousActivity?.reasons?.map((reason: string, index: number) => (
                            <li key={index}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">⚖️ Regras do Marketplace</h3>
                  <div className="text-sm text-gray-400">
                    {rules.filter(r => r.isActive).length} de {rules.length} regras ativas
                  </div>
                </div>

                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`rounded-lg p-4 border ${getCategoryColor(rule.category)} ${
                        !rule.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-medium">{rule.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(rule.category)}`}>
                              {rule.category}
                            </span>
                            <span className="text-gray-400 text-xs">
                              Prioridade: {rule.priority}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{rule.description}</p>
                          
                          {rule.configuration.description && (
                            <p className="text-gray-400 text-xs">
                              {rule.configuration.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {/* Toggle Switch */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rule.isActive}
                              onChange={(e) => toggleRule(rule.id, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm text-gray-300">
                              {rule.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                          </label>

                          {/* Edit Button */}
                          {rule.configuration.editable && rule.configuration.editable.length > 0 && (
                            <button
                              onClick={() => startEditingRule(rule.id)}
                              disabled={editingRule === rule.id}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-sm"
                            >
                              {editingRule === rule.id ? 'Editando...' : 'Configurar'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editable Configuration */}
                      {editingRule === rule.id && rule.configuration.editable && (
                        <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
                          <h5 className="text-white font-medium mb-3">Configurações</h5>
                          <div className="space-y-3">
                            {rule.configuration.editable.map((field: string) => (
                              <div key={field} className="flex items-center space-x-3">
                                <label className="text-sm text-gray-300 w-40">
                                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                </label>
                                
                                {typeof rule.configuration[field] === 'boolean' ? (
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={ruleChanges[rule.id]?.[field] ?? rule.configuration[field]}
                                      onChange={(e) => updateRuleConfig(rule.id, field, e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                  </label>
                                ) : (
                                  <input
                                    type="number"
                                    value={ruleChanges[rule.id]?.[field] ?? rule.configuration[field]}
                                    onChange={(e) => updateRuleConfig(rule.id, field, parseInt(e.target.value))}
                                    className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-24"
                                    min="1"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <button
                              onClick={() => saveRuleChanges(rule.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelEditingRule}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Current Values Display */}
                      {rule.configuration.editable && editingRule !== rule.id && (
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          {rule.configuration.editable.map((field: string) => (
                            <div key={field} className="text-gray-400">
                              <span className="capitalize">
                                {field.replace(/([A-Z])/g, ' $1')}:
                              </span>
                              <span className="text-white ml-1">
                                {typeof rule.configuration[field] === 'boolean' 
                                  ? (rule.configuration[field] ? 'Sim' : 'Não')
                                  : rule.configuration[field]
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {rules.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">⚖️</div>
                    <p>Carregando regras...</p>
                  </div>
                )}
              </div>

              {/* Quick Actions for Rules */}
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-4">🔧 Ações Rápidas</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      rules.forEach(rule => {
                        if (!rule.isActive) toggleRule(rule.id, true)
                      })
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                  >
                    ✅ Ativar Todas as Regras
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Tem certeza que deseja desativar todas as regras? Isso pode comprometer a segurança do marketplace.')) {
                        rules.forEach(rule => {
                          if (rule.isActive) toggleRule(rule.id, false)
                        })
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                  >
                    ❌ Desativar Todas as Regras
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && marketplaceStats && (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">💰 Transações Recentes</h3>
              <div className="space-y-3">
                {marketplaceStats.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{transaction.itemName}</div>
                      <div className="text-gray-400 text-sm">
                        {transaction.buyerName} ← {transaction.sellerName}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{transaction.price} créditos</div>
                      <div className={`text-xs font-medium ${
                        transaction.status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Admin Panel
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}