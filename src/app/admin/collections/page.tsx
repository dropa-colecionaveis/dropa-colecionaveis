'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'

interface Collection {
  id: string
  name: string
  description: string | null
  themeId: string | null
  customTheme: string | null
  theme?: {
    id: string
    name: string
    displayName: string
    emoji: string
    colorClass: string
    borderClass: string
  }
  imageUrl: string | null
  maxItems: number
  isActive: boolean
  isLimited: boolean
  createdAt: string
  stats: {
    totalItems: number
    totalUsers: number
    completedByUsers: number
    completionRate: number
  }
}

interface Theme {
  id: string
  name: string
  displayName: string
  description: string | null
  emoji: string
  colorClass: string
  borderClass: string
  isActive: boolean
  isSystem: boolean
}

export default function AdminCollections() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [collections, setCollections] = useState<Collection[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [themeInput, setThemeInput] = useState('') // For theme search/autocomplete
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const themeDropdownRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    maxItems: '',
    isLimited: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/collections')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/dashboard')
      } else {
        fetchCollections()
        fetchThemes()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/admin/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/admin/themes')
      if (response.ok) {
        const data = await response.json()
        setThemes(data.filter((theme: Theme) => theme.isActive))
      }
    } catch (error) {
      console.error('Error fetching themes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || (!selectedThemeId && !themeInput.trim()) || !formData.maxItems) {
      alert('❌ Nome, tema e máximo de itens são obrigatórios!')
      return
    }

    try {
      const url = editingCollection ? `/api/admin/collections/${editingCollection.id}` : '/api/admin/collections'
      const method = editingCollection ? 'PUT' : 'POST'
      
      const submitData = {
        ...formData,
        themeId: selectedThemeId,
        customTheme: selectedThemeId ? null : themeInput.trim()
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        alert(editingCollection ? '✅ Coleção atualizada!' : '✅ Coleção criada!')
        setShowModal(false)
        resetForm()
        fetchCollections()
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving collection:', error)
      alert('❌ Erro ao salvar coleção')
    }
  }

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setFormData({
      name: collection.name,
      description: collection.description || '',
      imageUrl: collection.imageUrl || '',
      maxItems: collection.maxItems.toString(),
      isLimited: collection.isLimited
    })
    
    // Set theme data
    if (collection.themeId && collection.theme) {
      setSelectedThemeId(collection.themeId)
      setThemeInput(collection.theme.displayName)
    } else if (collection.customTheme) {
      setSelectedThemeId(null)
      setThemeInput(collection.customTheme)
    } else {
      setSelectedThemeId(null)
      setThemeInput('')
    }
    
    setShowModal(true)
  }

  const handleToggleStatus = async (collection: Collection) => {
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...collection,
          isActive: !collection.isActive
        })
      })

      if (response.ok) {
        alert(`✅ Coleção ${!collection.isActive ? 'ativada' : 'desativada'}!`)
        fetchCollections()
      } else {
        alert('❌ Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('❌ Erro ao atualizar status')
    }
  }

  const handleDelete = async (collection: Collection) => {
    if (collection.isActive) {
      alert('❌ Desative a coleção antes de excluí-la')
      return
    }

    if (collection.stats.totalItems > 0) {
      alert('❌ Não é possível deletar coleção que contém itens. Remova todos os itens primeiro.')
      return
    }

    if (collection.stats.totalUsers > 0) {
      alert('❌ Não é possível deletar coleção que usuários têm progresso.')
      return
    }

    if (!confirm(`Tem certeza que deseja deletar a coleção "${collection.name}"?\n\nEsta ação é irreversível!`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('✅ Coleção deletada com sucesso!')
        fetchCollections()
      } else {
        const errorData = await response.json()
        alert(`❌ Erro ao deletar: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert('❌ Erro ao deletar coleção')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      maxItems: '',
      isLimited: false
    })
    setThemeInput('')
    setSelectedThemeId(null)
    setShowThemeDropdown(false)
    setEditingCollection(null)
  }

  const getThemeDisplay = (collection: Collection) => {
    if (collection.theme) {
      return {
        name: collection.theme.displayName,
        emoji: collection.theme.emoji,
        colorClass: `${collection.theme.colorClass}`,
        borderClass: collection.theme.borderClass
      }
    } else if (collection.customTheme) {
      return {
        name: collection.customTheme,
        emoji: '📚',
        colorClass: 'from-gray-500/20 to-slate-500/20',
        borderClass: 'border-gray-500/30'
      }
    }
    return {
      name: 'Sem tema',
      emoji: '❓',
      colorClass: 'from-gray-500/20 to-slate-500/20',
      borderClass: 'border-gray-500/30'
    }
  }

  const handleThemeInput = (value: string) => {
    setThemeInput(value)
    setShowThemeDropdown(true)
    setSelectedThemeId(null)
  }

  const selectTheme = (theme: Theme) => {
    setSelectedThemeId(theme.id)
    setThemeInput(theme.displayName)
    setShowThemeDropdown(false)
  }

  const filteredThemes = themes.filter(theme => 
    theme.displayName.toLowerCase().includes(themeInput.toLowerCase()) ||
    theme.name.toLowerCase().includes(themeInput.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false)
      }
    }
    
    if (showThemeDropdown) {
      // Add a small delay to prevent immediate closing
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showThemeDropdown])

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
            <span className="text-white">Gerenciar Coleções</span>
          </div>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Gerenciar Coleções</h1>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200 flex items-center space-x-2"
            >
              <span>📚</span>
              <span>Nova Coleção</span>
            </button>
          </div>

          {/* Collections Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                      {collection.isLimited && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Limitada
                        </span>
                      )}
                    </div>
                    
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold mb-3 bg-gradient-to-r ${getThemeDisplay(collection).colorClass} border ${getThemeDisplay(collection).borderClass}`}>
                      <span>{getThemeDisplay(collection).emoji}</span>
                      <span className="text-white">{getThemeDisplay(collection).name}</span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {collection.description || 'Sem descrição'}
                    </p>
                  </div>
                  
                  <div className={`px-2 py-1 rounded text-sm ${
                    collection.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {collection.isActive ? '✅' : '❌'}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Itens:</span>
                    <span className="text-white">
                      {collection.stats.totalItems}/{collection.maxItems}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-gray-300">
                    <span>Usuários:</span>
                    <span className="text-white">{collection.stats.totalUsers}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-300">
                    <span>Concluída:</span>
                    <span className="text-green-400">
                      {collection.stats.completedByUsers} ({collection.stats.completionRate}%)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>Progresso</span>
                    <span>{Math.round((collection.stats.totalItems / collection.maxItems) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(collection.stats.totalItems / collection.maxItems) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(collection)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition duration-200"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(collection)}
                    className={`flex-1 px-3 py-2 rounded text-sm transition duration-200 ${
                      collection.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {collection.isActive ? '🚫' : '✅'}
                  </button>
                  
                  {(!collection.isActive && collection.stats.totalItems === 0 && collection.stats.totalUsers === 0) && (
                    <button
                      onClick={() => handleDelete(collection)}
                      className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded text-sm transition duration-200"
                      title="Excluir coleção"
                    >
                      🗑️
                    </button>
                  )}
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

      {/* Modal for Adding/Editing Collections */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingCollection ? 'Editar Coleção' : 'Nova Coleção'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Nome da Coleção: *</label>
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
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="relative" ref={themeDropdownRef}>
                <label className="block text-gray-300 mb-2">Tema: *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={themeInput}
                    onChange={(e) => handleThemeInput(e.target.value)}
                    onFocus={() => setShowThemeDropdown(true)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite ou selecione um tema..."
                    required
                  />
                  
                  <Link
                    href="/admin/themes"
                    target="_blank"
                    className="absolute right-2 top-2 text-blue-400 hover:text-blue-300 text-sm"
                    title="Gerenciar Temas"
                  >
                    🎨
                  </Link>
                </div>
                
                {/* Theme Dropdown */}
                {showThemeDropdown && (
                  <div className="theme-dropdown absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Existing Themes */}
                    {filteredThemes.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs text-gray-400 font-semibold border-b border-gray-600">
                          Temas Existentes
                        </div>
                        {filteredThemes.map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => selectTheme(theme)}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors ${
                              selectedThemeId === theme.id ? 'bg-blue-600' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{theme.emoji}</span>
                              <div className="flex-1">
                                <div className="text-white font-medium">{theme.displayName}</div>
                                <div className="text-xs text-gray-400">/{theme.name}</div>
                                {theme.description && (
                                  <div className="text-xs text-gray-400 truncate">{theme.description}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Custom Theme Option */}
                    {themeInput.trim() && !filteredThemes.some(t => t.displayName.toLowerCase() === themeInput.toLowerCase()) && (
                      <div>
                        {filteredThemes.length > 0 && <div className="border-t border-gray-600"></div>}
                        <div className="px-3 py-2 text-xs text-gray-400 font-semibold">
                          Criar Novo Tema
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedThemeId(null)
                            setShowThemeDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">📚</span>
                            <div className="flex-1">
                              <div className="text-white font-medium">✨ "{themeInput}"</div>
                              <div className="text-xs text-gray-400">Criar como tema customizado</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                    
                    {/* No results */}
                    {themeInput.trim() && filteredThemes.length === 0 && (
                      <div className="px-3 py-4 text-center text-gray-400 text-sm">
                        Digite para criar um novo tema: "{themeInput}"
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Theme Preview */}
                {(selectedThemeId || themeInput.trim()) && (
                  <div className="mt-2 p-2 bg-gray-700 rounded">
                    <div className="text-xs text-gray-400 mb-1">
                      {selectedThemeId ? 'Tema Selecionado:' : 'Novo Tema:'}
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedThemeId ? (
                        filteredThemes.find(t => t.id === selectedThemeId) && (
                          <>
                            <span className="text-lg">{filteredThemes.find(t => t.id === selectedThemeId)?.emoji}</span>
                            <span className="text-white font-medium">{filteredThemes.find(t => t.id === selectedThemeId)?.displayName}</span>
                          </>
                        )
                      ) : (
                        <>
                          <span className="text-lg">📚</span>
                          <span className="text-white font-medium">{themeInput}</span>
                          <span className="text-xs text-green-400">(Novo)</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-2">URL da Imagem:</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/collections/exemplo.jpg"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Máximo de Itens: *</label>
                <input
                  type="number"
                  value={formData.maxItems}
                  onChange={(e) => setFormData({...formData, maxItems: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1000"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isLimited"
                  checked={formData.isLimited}
                  onChange={(e) => setFormData({...formData, isLimited: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isLimited" className="text-gray-300">
                  Coleção Limitada
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition duration-200"
                >
                  {editingCollection ? '✅ Atualizar' : '✅ Criar'}
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