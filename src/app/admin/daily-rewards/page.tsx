'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'

interface PackType {
  id: string
  name: string
  displayName: string
  emoji: string
  color: string
}

interface DailyReward {
  id: string
  day: number
  rewardType: 'CREDITS' | 'PACK' | 'ITEMS'
  rewardValue: number
  packTypeId: string | null
  description: string
  isActive: boolean
  createdAt: string
  packType: PackType | null
  _count: {
    claims: number
  }
}

interface RewardFormData {
  day: number
  rewardType: 'CREDITS' | 'PACK' | 'ITEMS'
  rewardValue: number
  packTypeId: string
  description: string
}

export default function DailyRewardsAdmin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  
  const [rewards, setRewards] = useState<DailyReward[]>([])
  const [packTypes, setPackTypes] = useState<PackType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReward, setEditingReward] = useState<DailyReward | null>(null)
  const [formData, setFormData] = useState<RewardFormData>({
    day: 1,
    rewardType: 'CREDITS',
    rewardValue: 10,
    packTypeId: '',
    description: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/daily-rewards')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/admin')
      } else {
        fetchRewards()
        fetchPackTypes()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/admin/daily-rewards')
      if (response.ok) {
        const data = await response.json()
        setRewards(data.rewards)
      } else {
        console.error('Failed to fetch daily rewards')
      }
    } catch (error) {
      console.error('Error fetching daily rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPackTypes = async () => {
    try {
      const response = await fetch('/api/admin/pack-types')
      if (response.ok) {
        const data = await response.json()
        setPackTypes(data.packTypes.filter((type: any) => type.isActive))
      }
    } catch (error) {
      console.error('Error fetching pack types:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      day: 1,
      rewardType: 'CREDITS',
      rewardValue: 10,
      packTypeId: '',
      description: ''
    })
    setEditingReward(null)
    setShowCreateModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description.trim()) {
      alert('Descrição é obrigatória')
      return
    }

    if (formData.rewardType === 'PACK' && !formData.packTypeId) {
      alert('Tipo de pacote é obrigatório para recompensas de pacote')
      return
    }

    try {
      const url = editingReward 
        ? `/api/admin/daily-rewards/${editingReward.id}`
        : '/api/admin/daily-rewards'
      
      const method = editingReward ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          packTypeId: formData.rewardType === 'PACK' ? formData.packTypeId : null
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(editingReward ? 'Recompensa atualizada com sucesso!' : 'Recompensa criada com sucesso!')
        resetForm()
        fetchRewards()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao salvar a recompensa')
      console.error('Error saving daily reward:', error)
    }
  }

  const handleEdit = (reward: DailyReward) => {
    setEditingReward(reward)
    setFormData({
      day: reward.day,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      packTypeId: reward.packTypeId || '',
      description: reward.description
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (reward: DailyReward) => {
    const message = reward._count.claims > 0
      ? `Esta recompensa foi reivindicada ${reward._count.claims} vezes. Ela será desativada, não deletada. Continuar?`
      : 'Tem certeza que deseja deletar esta recompensa?'

    if (!confirm(message)) return

    try {
      const response = await fetch(`/api/admin/daily-rewards/${reward.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        fetchRewards()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao deletar a recompensa')
      console.error('Error deleting daily reward:', error)
    }
  }

  const toggleStatus = async (reward: DailyReward) => {
    try {
      const response = await fetch(`/api/admin/daily-rewards/${reward.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !reward.isActive
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Recompensa ${!reward.isActive ? 'ativada' : 'desativada'} com sucesso!`)
        fetchRewards()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao alterar status')
      console.error('Error toggling status:', error)
    }
  }

  const getRewardIcon = (reward: DailyReward) => {
    if (reward.rewardType === 'CREDITS') {
      return '💰'
    } else if (reward.rewardType === 'PACK') {
      return reward.packType?.emoji || '📦'
    } else {
      return '🎁'
    }
  }

  const getRewardDescription = (reward: DailyReward) => {
    if (reward.rewardType === 'CREDITS') {
      return `${reward.rewardValue} Créditos`
    } else if (reward.rewardType === 'PACK') {
      return `${reward.rewardValue}x ${reward.packType?.displayName || 'Pacote'}`
    } else {
      return reward.description
    }
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
            🎁 Gerenciar Recompensas Diárias
          </Link>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Recompensas Diárias</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
            >
              ➕ Nova Recompensa
            </button>
          </div>

          {/* Create/Edit Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-white mb-4">
                  {editingReward ? 'Editar Recompensa' : 'Criar Nova Recompensa'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Dia do Ciclo (1-7) *
                    </label>
                    <select
                      value={formData.day}
                      onChange={(e) => setFormData({...formData, day: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {[1,2,3,4,5,6,7].map(day => (
                        <option key={day} value={day}>Dia {day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Tipo de Recompensa *
                    </label>
                    <select
                      value={formData.rewardType}
                      onChange={(e) => setFormData({...formData, rewardType: e.target.value as any})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="CREDITS">💰 Créditos</option>
                      <option value="PACK">📦 Pacote</option>
                      <option value="ITEMS">🎁 Itens</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Valor da Recompensa *
                    </label>
                    <input
                      type="number"
                      value={formData.rewardValue}
                      onChange={(e) => setFormData({...formData, rewardValue: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 10 para créditos, 1 para pacotes"
                      min="1"
                      required
                    />
                  </div>

                  {formData.rewardType === 'PACK' && (
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Tipo de Pacote *
                      </label>
                      <select
                        value={formData.packTypeId}
                        onChange={(e) => setFormData({...formData, packTypeId: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione um tipo</option>
                        {packTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.emoji} {type.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Descrição *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                      placeholder="Descrição da recompensa"
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      {editingReward ? 'Atualizar' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rewards Table */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-medium">Dia</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Recompensa</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Claims</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((reward) => (
                    <tr key={reward.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="text-white font-bold text-lg">Dia {reward.day}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getRewardIcon(reward)}</span>
                          <div>
                            <div className="text-white font-medium">
                              {getRewardDescription(reward)}
                            </div>
                            <div className="text-gray-300 text-sm">{reward.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          reward.rewardType === 'CREDITS' 
                            ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'
                            : reward.rewardType === 'PACK'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {reward.rewardType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          reward.isActive 
                            ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                            : 'bg-red-600/20 text-red-300 border border-red-500/30'
                        }`}>
                          {reward.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{reward._count.claims}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(reward)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleStatus(reward)}
                            className={`px-2 py-1 text-white text-xs rounded transition-colors ${
                              reward.isActive
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {reward.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDelete(reward)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {rewards.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">Nenhuma recompensa encontrada</div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                Criar Primeira Recompensa
              </button>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Admin
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}