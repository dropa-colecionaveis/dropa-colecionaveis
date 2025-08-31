'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRarityName } from '@/lib/rarity-system'
import { useAdmin } from '@/hooks/useAdmin'
import { ScarcityLevel, ScarcityManager } from '@/lib/scarcity-system'

interface Collection {
  id: string
  name: string
  theme: string
  isLimited: boolean
}

interface Item {
  id: string
  name: string
  description: string | null
  rarity: string
  value: number
  imageUrl: string
  isActive: boolean
  createdAt: string
  collectionId: string | null
  itemNumber: number | null
  collection: Collection | null
  isLimitedEdition: boolean
  maxEditions: number | null
  currentEditions: number
  // Novos campos do Sistema de Escassez
  isUnique: boolean
  scarcityLevel: string
  uniqueOwnerId: string | null
  isTemporal: boolean
  availableFrom: string | null
  availableUntil: string | null
}

export default function AdminItems() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [items, setItems] = useState<Item[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<string>('ALL')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'COMUM',
    value: '',
    imageUrl: '',
    collectionId: '',
    isLimitedEdition: false,
    maxEditions: '',
    // Novos campos do Sistema de Escassez
    isUnique: false,
    scarcityLevel: 'COMMON',
    isTemporal: false,
    availableFrom: '',
    availableUntil: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/items')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/dashboard')
      } else {
        fetchItems()
        fetchCollections()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/admin/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null
    
    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.imageUrl
      } else {
        const errorData = await response.json()
        alert(`❌ Erro no upload: ${errorData.error}`)
        return null
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('❌ Erro no upload da imagem')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let finalImageUrl = formData.imageUrl
      
      // Upload new image if selected
      if (selectedFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        } else {
          return // Stop if upload failed
        }
      }
      
      const url = editingItem ? `/api/admin/items/${editingItem.id}` : '/api/admin/items'
      const method = editingItem ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        imageUrl: finalImageUrl,
        value: parseInt(formData.value),
        collectionId: formData.collectionId || null,
        maxEditions: formData.maxEditions ? parseInt(formData.maxEditions) : null,
        // Novos campos do Sistema de Escassez
        availableFrom: formData.availableFrom ? new Date(formData.availableFrom).toISOString() : null,
        availableUntil: formData.availableUntil ? new Date(formData.availableUntil).toISOString() : null,
        // Include isActive when editing
        ...(editingItem && { isActive: editingItem.isActive })
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert(editingItem ? '✅ Item atualizado!' : '✅ Item criado!')
        setShowModal(false)
        resetForm()
        fetchItems()
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`❌ Erro ao salvar item: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert('❌ Erro ao salvar item')
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      rarity: item.rarity,
      value: item.value.toString(),
      imageUrl: item.imageUrl,
      collectionId: item.collectionId || '',
      isLimitedEdition: item.isLimitedEdition,
      maxEditions: item.maxEditions?.toString() || '',
      // Novos campos do Sistema de Escassez
      isUnique: item.isUnique || false,
      scarcityLevel: item.scarcityLevel || 'COMMON',
      isTemporal: item.isTemporal || false,
      availableFrom: item.availableFrom ? new Date(item.availableFrom).toISOString().slice(0, 16) : '',
      availableUntil: item.availableUntil ? new Date(item.availableUntil).toISOString().slice(0, 16) : ''
    })
    // Reset file selection when editing
    setSelectedFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const handleToggleStatus = async (item: Item) => {
    try {
      const response = await fetch(`/api/admin/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive
        })
      })

      if (response.ok) {
        alert(`✅ Item ${!item.isActive ? 'ativado' : 'desativado'}!`)
        fetchItems()
      } else {
        alert('❌ Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('❌ Erro ao atualizar status')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rarity: 'COMUM',
      value: '',
      imageUrl: '',
      collectionId: '',
      isLimitedEdition: false,
      maxEditions: '',
      // Novos campos do Sistema de Escassez
      isUnique: false,
      scarcityLevel: 'COMMON',
      isTemporal: false,
      availableFrom: '',
      availableUntil: ''
    })
    setEditingItem(null)
    setSelectedFile(null)
    setImagePreview(null)
  }

  const getFilteredItems = () => {
    if (selectedCollection === 'ALL') {
      return items
    }
    if (selectedCollection === 'NONE') {
      return items.filter(item => !item.collectionId)
    }
    return items.filter(item => item.collectionId === selectedCollection)
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

  const getScarcityOptions = () => [
    { value: 'COMMON', label: '⚪ Comum' },
    { value: 'UNCOMMON', label: '🟢 Incomum' },
    { value: 'RARE', label: '🔵 Raro' },
    { value: 'EPIC', label: '🟣 Épico' },
    { value: 'LEGENDARY', label: '🟡 Lendário' },
    { value: 'MYTHIC', label: '🔴 Mítico' },
    { value: 'UNIQUE', label: '🌟 Único' }
  ]

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
            <span className="text-white">Gerenciar Itens</span>
          </div>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Gerenciar Itens</h1>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200"
            >
              ➕ Novo Item
            </button>
          </div>

          {/* Collection Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCollection('ALL')}
                className={`px-4 py-2 rounded-lg transition duration-200 ${
                  selectedCollection === 'ALL' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/15'
                }`}
              >
                Todos ({items.length})
              </button>
              
              <button
                onClick={() => setSelectedCollection('NONE')}
                className={`px-4 py-2 rounded-lg transition duration-200 ${
                  selectedCollection === 'NONE' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/15'
                }`}
              >
                Sem Coleção ({items.filter(item => !item.collectionId).length})
              </button>
              
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection.id)}
                  className={`px-4 py-2 rounded-lg transition duration-200 ${
                    selectedCollection === collection.id
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {collection.name} ({items.filter(item => item.collectionId === collection.id).length})
                  {collection.isLimited && <span className="ml-1 text-red-400">*</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getFilteredItems().map((item) => (
              <div key={item.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {item.imageUrl && item.imageUrl !== '/items/default.jpg' ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = '🏆'
                        }}
                      />
                    ) : (
                      <span className="text-2xl">🏆</span>
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-1 ${getRarityColor(item.rarity)}`}>
                    {item.name}
                    {item.isLimitedEdition && <span className="text-purple-400 ml-1">🏆</span>}
                    {item.isUnique && <span className="text-pink-400 ml-1">🌟</span>}
                    {item.isTemporal && <span className="text-orange-400 ml-1">⏰</span>}
                  </h3>
                  
                  {item.collection && (
                    <div className="text-xs text-orange-400 mb-1">
                      {item.collection.name} #{item.itemNumber}
                      {item.collection.isLimited && <span className="text-red-400 ml-1">★</span>}
                    </div>
                  )}
                  
                  <p className="text-gray-300 text-sm mb-3 h-12 overflow-hidden">
                    {item.description || 'Sem descrição'}
                  </p>
                  
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 ${getRarityColor(item.rarity)} bg-white/10`}>
                    {getRarityName(item.rarity)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Valor:</span>
                    <span className="text-green-400 font-semibold">
                      {item.value} créditos
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-gray-300">
                    <span>Status:</span>
                    <span className={item.isActive ? 'text-green-400' : 'text-red-400'}>
                      {item.isActive ? '✅ Ativo' : '❌ Inativo'}
                    </span>
                  </div>

                  {item.isLimitedEdition && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-purple-400">🏆 Limitada:</span>
                      <span className="text-purple-400 font-semibold">
                        {item.currentEditions}/{item.maxEditions || '∞'}
                      </span>
                    </div>
                  )}

                  {item.isUnique && (
                    <div className="flex justify-between text-gray-300">
                      <span className="text-pink-400">🌟 Único:</span>
                      <span className={`font-semibold ${item.uniqueOwnerId ? 'text-red-400' : 'text-green-400'}`}>
                        {item.uniqueOwnerId ? 'Possuído' : 'Disponível'}
                      </span>
                    </div>
                  )}

                  {item.scarcityLevel && item.scarcityLevel !== 'COMMON' && (
                    <div className="flex justify-between text-gray-300">
                      <span>Escassez:</span>
                      <span className={`font-semibold ${ScarcityManager.getScarcityColor(item.scarcityLevel as any)}`}>
                        {ScarcityManager.getScarcityEmoji(item.scarcityLevel as any)} {ScarcityManager.getScarcityName(item.scarcityLevel as any)}
                      </span>
                    </div>
                  )}

                  {item.isTemporal && (
                    <div className="text-xs text-orange-400 mt-2">
                      ⏰ Disponibilidade Temporal Ativa
                      {item.availableFrom && (
                        <div>De: {new Date(item.availableFrom).toLocaleString('pt-BR')}</div>
                      )}
                      {item.availableUntil && (
                        <div>Até: {new Date(item.availableUntil).toLocaleString('pt-BR')}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition duration-200"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`flex-1 px-3 py-2 rounded text-sm transition duration-200 ${
                      item.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {item.isActive ? '🚫' : '✅'}
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

      {/* Modal for Adding/Editing Items */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Nome do Item:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Descrição:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Raridade:</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData({...formData, rarity: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMUM">Comum</option>
                  <option value="INCOMUM">Incomum</option>
                  <option value="RARO">Raro</option>
                  <option value="EPICO">Épico</option>
                  <option value="LENDARIO">Lendário</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Valor (créditos):</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              {/* Limited Edition Section */}
              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isLimitedEdition"
                    checked={formData.isLimitedEdition}
                    onChange={(e) => setFormData({...formData, isLimitedEdition: e.target.checked, maxEditions: e.target.checked ? formData.maxEditions : ''})}
                    className="mr-3 h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="isLimitedEdition" className="text-gray-300 font-medium">
                    🏆 Edição Limitada
                  </label>
                </div>

                {formData.isLimitedEdition && (
                  <div>
                    <label className="block text-gray-300 mb-2">Máximo de Edições:</label>
                    <input
                      type="number"
                      value={formData.maxEditions}
                      onChange={(e) => setFormData({...formData, maxEditions: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="10000"
                      placeholder="Ex: 100, 500, 1000..."
                      required
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Número máximo de cópias que podem ser obtidas deste item
                    </div>
                  </div>
                )}
              </div>

              {/* Sistema de Escassez Section */}
              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-lg font-semibold text-white mb-4">🌟 Sistema de Escassez</h4>
                
                {/* Item Único */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isUnique"
                    checked={formData.isUnique}
                    onChange={(e) => setFormData({...formData, isUnique: e.target.checked})}
                    className="mr-3 h-4 w-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500 focus:ring-2"
                  />
                  <label htmlFor="isUnique" className="text-gray-300 font-medium">
                    🌟 Item Único (Apenas 1 exemplar mundial)
                  </label>
                </div>

                {/* Nível de Escassez */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Nível de Escassez:</label>
                  <select
                    value={formData.scarcityLevel}
                    onChange={(e) => setFormData({...formData, scarcityLevel: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {getScarcityOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-400 mt-1">
                    Define a raridade e dificuldade de obtenção do item
                  </div>
                </div>

                {/* Disponibilidade Temporal */}
                <div className="border-t border-gray-500 pt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="isTemporal"
                      checked={formData.isTemporal}
                      onChange={(e) => setFormData({...formData, isTemporal: e.target.checked})}
                      className="mr-3 h-4 w-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <label htmlFor="isTemporal" className="text-gray-300 font-medium">
                      ⏰ Disponibilidade Temporal
                    </label>
                  </div>

                  {formData.isTemporal && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-2">Disponível a partir de:</label>
                        <input
                          type="datetime-local"
                          value={formData.availableFrom}
                          onChange={(e) => setFormData({...formData, availableFrom: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-2">Disponível até:</label>
                        <input
                          type="datetime-local"
                          value={formData.availableUntil}
                          onChange={(e) => setFormData({...formData, availableUntil: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Coleção:</label>
                <select
                  value={formData.collectionId}
                  onChange={(e) => setFormData({...formData, collectionId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem coleção</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name} {collection.isLimited ? '(Limitada)' : ''}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-400 mt-1">
                  O número do item na coleção será automaticamente atribuído
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Imagem do Item:</label>
                
                {/* File Upload */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                  </div>
                </div>

                {/* Image Preview */}
                {(imagePreview || (!selectedFile && formData.imageUrl)) && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-300 mb-2">Preview:</div>
                    <div className="w-24 h-24 border border-gray-600 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : formData.imageUrl ? (
                        <img 
                          src={formData.imageUrl} 
                          alt="Current" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="text-gray-500 text-xs text-center">
                          🖼️<br/>Preview
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback URL input (optional) */}
                <details className="mb-2">
                  <summary className="text-sm text-gray-400 cursor-pointer">
                    📎 Ou usar URL externa (opcional)
                  </summary>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full mt-2 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </details>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition duration-200"
                >
                  {uploading ? '📤 Enviando...' : editingItem ? '✅ Atualizar' : '✅ Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-200"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}