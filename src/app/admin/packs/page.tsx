'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRarityName } from '@/lib/rarity-system'
import { useAdmin } from '@/hooks/useAdmin'

interface PackProbability {
  id: string
  rarity: string
  percentage: number
}

interface Pack {
  id: string
  type: string
  name: string
  description: string | null
  price: number
  isActive: boolean
  createdAt: string
  probabilities: PackProbability[]
}

export default function AdminPacks() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPack, setEditingPack] = useState<Pack | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [probabilities, setProbabilities] = useState({
    COMUM: '',
    INCOMUM: '',
    RARO: '',
    EPICO: '',
    LENDARIO: ''
  })
  const [newPack, setNewPack] = useState({
    type: '',
    name: '',
    description: '',
    price: ''
  })
  const [editPackData, setEditPackData] = useState({
    type: '',
    name: '',
    description: '',
    price: ''
  })
  const [availablePackTypes, setAvailablePackTypes] = useState<Array<{id: string, name: string, displayName: string, emoji: string}>>([])
  const [packTypesLoading, setPackTypesLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/packs')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/dashboard')
      } else {
        fetchPacks()
        fetchPackTypes()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchPackTypes = async () => {
    try {
      const response = await fetch('/api/admin/pack-types')
      if (response.ok) {
        const data = await response.json()
        setAvailablePackTypes(data.packTypes.filter((type: any) => type.isActive))
      }
    } catch (error) {
      console.error('Error fetching pack types:', error)
    } finally {
      setPackTypesLoading(false)
    }
  }

  const fetchPacks = async () => {
    try {
      const response = await fetch('/api/admin/packs')
      if (response.ok) {
        const data = await response.json()
        setPacks(data)
      }
    } catch (error) {
      console.error('Error fetching packs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProbabilities = (pack: Pack) => {
    setEditingPack(pack)
    
    // Load pack data for editing
    setEditPackData({
      type: pack.type,
      name: pack.name,
      description: pack.description || '',
      price: pack.price.toString()
    })
    
    // Reset probabilities
    const newProbs = {
      COMUM: '',
      INCOMUM: '',
      RARO: '',
      EPICO: '',
      LENDARIO: ''
    }
    
    // Fill existing probabilities
    pack.probabilities.forEach(prob => {
      newProbs[prob.rarity as keyof typeof newProbs] = prob.percentage.toString()
    })
    
    setProbabilities(newProbs)
    setShowModal(true)
  }

  const handleSaveProbabilities = async () => {
    if (!editingPack) return

    // Validate pack data
    if (!editPackData.name.trim()) {
      alert('❌ Nome do pacote é obrigatório!')
      return
    }
    
    if (!editPackData.price || parseFloat(editPackData.price) <= 0) {
      alert('❌ Preço deve ser maior que zero!')
      return
    }

    // Validate that probabilities add up to 100
    const total = Object.values(probabilities).reduce((sum: number, val) => sum + (parseFloat(val) || 0), 0)
    if (Math.abs(total - 100) > 0.01) {
      alert('❌ As probabilidades devem somar exatamente 100%!')
      return
    }

    try {
      // Update pack basic data
      const packResponse = await fetch(`/api/admin/packs/${editingPack.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editPackData.type,
          name: editPackData.name.trim(),
          description: editPackData.description.trim() || null,
          price: parseFloat(editPackData.price)
        })
      })

      if (!packResponse.ok) {
        alert('❌ Erro ao atualizar dados do pacote')
        return
      }

      // Update probabilities
      const probResponse = await fetch(`/api/admin/packs/${editingPack.id}/probabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(probabilities)
      })

      if (probResponse.ok) {
        alert('✅ Pacote atualizado com sucesso!')
        setShowModal(false)
        fetchPacks()
      } else {
        alert('❌ Erro ao atualizar probabilidades')
      }
    } catch (error) {
      console.error('Error updating pack:', error)
      alert('❌ Erro ao atualizar pacote')
    }
  }

  const handleTogglePackStatus = async (pack: Pack) => {
    try {
      const response = await fetch(`/api/admin/packs/${pack.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pack,
          isActive: !pack.isActive
        })
      })

      if (response.ok) {
        alert(`✅ Pacote ${!pack.isActive ? 'ativado' : 'desativado'}!`)
        fetchPacks()
      } else {
        alert('❌ Erro ao atualizar status do pacote')
      }
    } catch (error) {
      console.error('Error toggling pack status:', error)
      alert('❌ Erro ao atualizar status do pacote')
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'text-gray-400'
      case 'INCOMUM': return 'text-green-400'
      case 'RARO': return 'text-blue-400'
      case 'EPICO': return 'text-purple-400'
      case 'LENDARIO': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getTotalPercentage = () => {
    return Object.values(probabilities).reduce((sum: number, val) => sum + (parseFloat(val) || 0), 0)
  }

  const getPackTypeEmoji = (type: string) => {
    const packType = availablePackTypes.find(pt => pt.name === type)
    return packType ? packType.emoji : '📦'
  }

  const getPackTypeName = (type: string) => {
    const packType = availablePackTypes.find(pt => pt.name === type)
    return packType ? packType.displayName : type
  }

  const handleCreatePack = () => {
    const defaultType = availablePackTypes.length > 0 ? availablePackTypes[0].name : 'BRONZE'
    setNewPack({
      type: defaultType,
      name: '',
      description: '',
      price: ''
    })
    setProbabilities({
      COMUM: '',
      INCOMUM: '',
      RARO: '',
      EPICO: '',
      LENDARIO: ''
    })
    setShowCreateModal(true)
  }

  const handleSaveNewPack = async () => {
    // Validate required fields
    if (!newPack.name || !newPack.price) {
      alert('❌ Nome e preço são obrigatórios!')
      return
    }

    // Validate probabilities sum to 100
    const total = Object.values(probabilities).reduce((sum: number, val) => sum + (parseFloat(val) || 0), 0)
    if (Math.abs(total - 100) > 0.01) {
      alert('❌ As probabilidades devem somar exatamente 100%!')
      return
    }

    try {
      const response = await fetch('/api/admin/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPack,
          probabilities
        })
      })

      if (response.ok) {
        alert('✅ Pacote criado com sucesso!')
        setShowCreateModal(false)
        fetchPacks()
      } else {
        const data = await response.json()
        alert(`❌ Erro ao criar pacote: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating pack:', error)
      alert('❌ Erro ao criar pacote')
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
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-2xl font-bold text-white">
              Admin Panel
            </Link>
            <span className="text-gray-400">→</span>
            <span className="text-white">Configurar Pacotes</span>
          </div>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Configurar Pacotes</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreatePack}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition duration-200 flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Criar Novo Pacote</span>
              </button>
              <div className="text-gray-300">
                {packs.length} pacotes configurados
              </div>
            </div>
          </div>

          {/* Packs Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {packs.map((pack) => (
              <div key={pack.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-4xl mb-2">
                      {getPackTypeEmoji(pack.type)}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{pack.name}</h2>
                    <p className="text-sm text-gray-400 mb-2">Tipo: {getPackTypeName(pack.type)}</p>
                    <p className="text-gray-300 mb-3">{pack.description}</p>
                    <div className="text-xl font-bold text-green-400">
                      {pack.price} créditos
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-sm ${
                      pack.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pack.isActive ? '✅ Ativo' : '❌ Inativo'}
                    </div>
                  </div>
                </div>

                {/* Current Probabilities */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Probabilidades Atuais:</h3>
                  <div className="space-y-2">
                    {pack.probabilities.map((prob) => (
                      <div key={prob.rarity} className="flex justify-between items-center">
                        <span className={`font-medium ${getRarityColor(prob.rarity)}`}>
                          {getRarityName(prob.rarity)}
                        </span>
                        <span className="text-white font-semibold">{prob.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Validation */}
                  <div className="mt-2 text-sm">
                    <span className="text-gray-400">Total: </span>
                    <span className={`font-semibold ${
                      Math.abs(pack.probabilities.reduce((sum, p) => sum + p.percentage, 0) - 100) < 0.01
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {pack.probabilities.reduce((sum, p) => sum + p.percentage, 0)}%
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditProbabilities(pack)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
                  >
                    ⚙️ Configurar
                  </button>
                  <button
                    onClick={() => handleTogglePackStatus(pack)}
                    className={`flex-1 px-4 py-2 rounded transition duration-200 ${
                      pack.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {pack.isActive ? '🚫 Desativar' : '✅ Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Painel Admin
            </Link>
          </div>
        </div>
      </main>

      {/* Modal for Editing Probabilities */}
      {showModal && editingPack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              Configurar Pacote - {editingPack.name}
            </h3>
            
            <div className="space-y-6">
              {/* Pack Basic Information */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Informações Básicas</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Tipo do Pacote *</label>
                    <select
                      value={editPackData.type}
                      onChange={(e) => setEditPackData({...editPackData, type: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {packTypesLoading ? (
                        <option disabled>Carregando tipos...</option>
                      ) : (
                        availablePackTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.emoji} {type.displayName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Preço (créditos) *</label>
                    <input
                      type="number"
                      value={editPackData.price}
                      onChange={(e) => setEditPackData({...editPackData, price: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-white font-medium mb-2">Nome do Pacote *</label>
                  <input
                    type="text"
                    value={editPackData.name}
                    onChange={(e) => setEditPackData({...editPackData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Pacote Bronze"
                    required
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-white font-medium mb-2">Descrição</label>
                  <textarea
                    value={editPackData.description}
                    onChange={(e) => setEditPackData({...editPackData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    placeholder="Descrição do pacote (opcional)"
                  />
                </div>
              </div>

              {/* Probabilities Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Configurar Probabilidades</h4>
                <div className="space-y-4">
              {Object.entries(probabilities).map(([rarity, percentage]) => (
                <div key={rarity}>
                  <label className={`block mb-2 font-medium ${getRarityColor(rarity)}`}>
                    {getRarityName(rarity)}:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={percentage}
                      onChange={(e) => setProbabilities({
                        ...probabilities,
                        [rarity]: e.target.value
                      })}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-gray-300">%</span>
                  </div>
                </div>
              ))}
              
              {/* Total Validation */}
              <div className="border-t border-gray-600 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total:</span>
                  <span className={`font-bold ${
                    Math.abs(getTotalPercentage() - 100) < 0.01
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {getTotalPercentage().toFixed(1)}%
                  </span>
                </div>
                {Math.abs(getTotalPercentage() - 100) > 0.01 && (
                  <div className="text-red-400 text-sm mt-1">
                    ⚠️ As probabilidades devem somar 100%
                  </div>
                )}
              </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveProbabilities}
                disabled={Math.abs(getTotalPercentage() - 100) > 0.01 || !editPackData.name.trim() || !editPackData.price || parseFloat(editPackData.price) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition duration-200"
              >
                ✅ Salvar Pacote
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating New Pack */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              ➕ Criar Novo Pacote
            </h3>
            
            {/* Pack Basic Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2 font-medium text-white">
                  Tipo do Pacote:
                </label>
                <select
                  value={newPack.type}
                  onChange={(e) => setNewPack({...newPack, type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {packTypesLoading ? (
                    <option disabled>Carregando tipos...</option>
                  ) : (
                    availablePackTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.emoji} {type.displayName}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-white">
                  Preço (créditos): *
                </label>
                <input
                  type="number"
                  value={newPack.price}
                  onChange={(e) => setNewPack({...newPack, price: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium text-white">
                Nome do Pacote: *
              </label>
              <input
                type="text"
                value={newPack.name}
                onChange={(e) => setNewPack({...newPack, name: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium text-white">
                Descrição:
              </label>
              <textarea
                value={newPack.description}
                onChange={(e) => setNewPack({...newPack, description: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Probabilities */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Probabilidades (%)</h4>
              <div className="space-y-4">
                {Object.entries(probabilities).map(([rarity, percentage]) => (
                  <div key={rarity}>
                    <label className={`block mb-2 font-medium ${getRarityColor(rarity)}`}>
                      {getRarityName(rarity)}:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={percentage}
                        onChange={(e) => setProbabilities({
                          ...probabilities,
                          [rarity]: e.target.value
                        })}
                        className="flex-1 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-gray-300">%</span>
                    </div>
                  </div>
                ))}
                
                {/* Total Validation */}
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total:</span>
                    <span className={`font-bold ${
                      Math.abs(getTotalPercentage() - 100) < 0.01
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {getTotalPercentage().toFixed(1)}%
                    </span>
                  </div>
                  {Math.abs(getTotalPercentage() - 100) > 0.01 && (
                    <div className="text-red-400 text-sm mt-1">
                      ⚠️ As probabilidades devem somar 100%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveNewPack}
                disabled={!newPack.name || !newPack.price || Math.abs(getTotalPercentage() - 100) > 0.01}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition duration-200"
              >
                ✅ Criar Pacote
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}