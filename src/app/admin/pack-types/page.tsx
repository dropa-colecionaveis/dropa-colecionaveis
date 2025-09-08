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
  description: string | null
  isActive: boolean
  isDefault: boolean
  createdAt: string
  _count: {
    packs: number
  }
}

interface PackTypeData {
  name: string
  displayName: string
  emoji: string
  color: string
  description: string
}

export default function PackTypesAdmin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [packTypes, setPackTypes] = useState<PackType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingType, setEditingType] = useState<PackType | null>(null)
  const [formData, setFormData] = useState<PackTypeData>({
    name: '',
    displayName: '',
    emoji: '📦',
    color: '#6b7280',
    description: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/pack-types')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/admin')
      } else {
        fetchPackTypes()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchPackTypes = async () => {
    try {
      const response = await fetch('/api/admin/pack-types')
      if (response.ok) {
        const data = await response.json()
        setPackTypes(data.packTypes)
      } else {
        console.error('Failed to fetch pack types')
      }
    } catch (error) {
      console.error('Error fetching pack types:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      emoji: '📦',
      color: '#6b7280',
      description: ''
    })
    setEditingType(null)
    setShowCreateModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.displayName.trim()) {
      alert('Nome e Nome de Exibição são obrigatórios')
      return
    }

    try {
      const url = editingType 
        ? `/api/admin/pack-types/${editingType.id}`
        : '/api/admin/pack-types'
      
      const method = editingType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        alert(editingType ? 'Tipo atualizado com sucesso!' : 'Tipo criado com sucesso!')
        resetForm()
        fetchPackTypes()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao salvar o tipo de pacote')
      console.error('Error saving pack type:', error)
    }
  }

  const handleEdit = (packType: PackType) => {
    setEditingType(packType)
    setFormData({
      name: packType.name,
      displayName: packType.displayName,
      emoji: packType.emoji,
      color: packType.color,
      description: packType.description || ''
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (packType: PackType) => {
    if (packType.isDefault) {
      alert('❌ Não é possível deletar tipos padrão!')
      return
    }

    const hasPacks = packType._count?.packs && packType._count.packs > 0
    const message = hasPacks 
      ? `Este tipo tem ${packType._count?.packs} pacotes associados. Ele será desativado, não deletado. Continuar?`
      : 'Tem certeza que deseja deletar este tipo de pacote?'

    if (!confirm(message)) return

    try {
      const response = await fetch(`/api/admin/pack-types/${packType.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        fetchPackTypes()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao deletar o tipo')
      console.error('Error deleting pack type:', error)
    }
  }

  const toggleStatus = async (packType: PackType) => {
    try {
      const response = await fetch(`/api/admin/pack-types/${packType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !packType.isActive
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Tipo ${!packType.isActive ? 'ativado' : 'desativado'} com sucesso!`)
        fetchPackTypes()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao alterar status')
      console.error('Error toggling status:', error)
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
            🏷️ Gerenciar Tipos de Pacotes
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
            <h1 className="text-3xl font-bold text-white">Tipos de Pacotes</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
            >
              ➕ Novo Tipo
            </button>
          </div>

          {/* Create/Edit Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-white mb-4">
                  {editingType ? 'Editar Tipo' : 'Criar Novo Tipo'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Nome Interno *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: CUSTOM_PACK"
                      required
                      disabled={editingType?.isDefault}
                    />
                    <small className="text-gray-400">
                      {editingType?.isDefault ? 'Não é possível alterar nome de tipos padrão' : 'Usado internamente, será convertido para maiúscula'}
                    </small>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Nome de Exibição *
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Pacote Personalizado"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Emoji
                      </label>
                      <input
                        type="text"
                        value={formData.emoji}
                        onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="📦"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Cor
                      </label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-full h-10 px-1 py-1 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                      placeholder="Descrição do tipo de pacote (opcional)"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      {editingType ? 'Atualizar' : 'Criar'}
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

          {/* Pack Types Table */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Nome</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Cor</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Pacotes</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Padrão</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {packTypes.map((type) => (
                    <tr key={type.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{type.emoji}</span>
                          <span className="text-white font-medium">{type.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-mono text-sm">{type.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          type.isActive 
                            ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                            : 'bg-red-600/20 text-red-300 border border-red-500/30'
                        }`}>
                          {type.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded-full border border-white/20"
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="text-gray-300 font-mono text-sm">{type.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{type._count?.packs || 0}</td>
                      <td className="px-4 py-3">
                        {type.isDefault && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                            Padrão
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(type)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            Editar
                          </button>
                          {!type.isDefault && (
                            <>
                              <button
                                onClick={() => toggleStatus(type)}
                                className={`px-2 py-1 text-white text-xs rounded transition-colors ${
                                  type.isActive
                                    ? 'bg-orange-600 hover:bg-orange-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {type.isActive ? 'Desativar' : 'Ativar'}
                              </button>
                              <button
                                onClick={() => handleDelete(type)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              >
                                Deletar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {packTypes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">Nenhum tipo encontrado</div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                Criar Primeiro Tipo
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