'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'

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
  createdAt: string
  _count: {
    collections: number
  }
}

const COLOR_OPTIONS = [
  { name: 'Cinza', value: 'from-gray-500/20 to-slate-500/20', border: 'border-gray-500/30' },
  { name: 'Âmbar', value: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30' },
  { name: 'Roxo', value: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
  { name: 'Azul', value: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
  { name: 'Verde', value: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
  { name: 'Vermelho', value: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30' },
  { name: 'Amarelo', value: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30' },
  { name: 'Rosa', value: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30' },
  { name: 'Índigo', value: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/30' },
  { name: 'Teal', value: 'from-teal-500/20 to-cyan-500/20', border: 'border-teal-500/30' }
]

const EMOJI_OPTIONS = ['📚', '⚔️', '🧙‍♂️', '💎', '🚀', '🐉', '🏢', '🎭', '🎨', '🌟', '🔥', '❄️', '🌙', '☀️', '🌊', '🌸', '🍀', '⚡', '💀', '👑']

export default function AdminThemes() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    emoji: '📚',
    colorClass: 'from-gray-500/20 to-slate-500/20',
    borderClass: 'border-gray-500/30'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/themes')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/dashboard')
      } else {
        fetchThemes()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/admin/themes')
      if (response.ok) {
        const data = await response.json()
        setThemes(data)
      }
    } catch (error) {
      console.error('Error fetching themes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.displayName) {
      alert('❌ Nome e nome de exibição são obrigatórios!')
      return
    }

    try {
      const url = editingTheme ? `/api/admin/themes/${editingTheme.id}` : '/api/admin/themes'
      const method = editingTheme ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert(editingTheme ? '✅ Tema atualizado!' : '✅ Tema criado!')
        setShowModal(false)
        resetForm()
        fetchThemes()
      } else {
        const errorData = await response.json()
        alert(`❌ Erro: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving theme:', error)
      alert('❌ Erro ao salvar tema')
    }
  }

  const handleEdit = (theme: Theme) => {
    if (theme.isSystem) {
      // Para temas do sistema, só permite editar alguns campos
      setEditingTheme(theme)
      setFormData({
        name: theme.name,
        displayName: theme.displayName,
        description: theme.description || '',
        emoji: theme.emoji,
        colorClass: theme.colorClass,
        borderClass: theme.borderClass
      })
      setShowModal(true)
    } else {
      setEditingTheme(theme)
      setFormData({
        name: theme.name,
        displayName: theme.displayName,
        description: theme.description || '',
        emoji: theme.emoji,
        colorClass: theme.colorClass,
        borderClass: theme.borderClass
      })
      setShowModal(true)
    }
  }

  const handleToggleStatus = async (theme: Theme) => {
    const confirmMessage = theme.isSystem 
      ? `⚠️ ATENÇÃO: Você está ${theme.isActive ? 'desativando' : 'ativando'} um tema de SISTEMA.\nIsso pode afetar o funcionamento da plataforma.\nDeseja continuar?`
      : `Deseja ${theme.isActive ? 'desativar' : 'ativar'} o tema "${theme.displayName}"?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/themes/${theme.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...theme,
          isActive: !theme.isActive
        })
      })

      if (response.ok) {
        alert(`✅ Tema ${!theme.isActive ? 'ativado' : 'desativado'}!`)
        fetchThemes()
      } else {
        alert('❌ Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('❌ Erro ao atualizar status')
    }
  }

  const handleDelete = async (theme: Theme) => {
    if (theme.isActive) {
      alert('❌ Desative o tema antes de excluí-lo')
      return
    }

    if (theme._count.collections > 0) {
      alert('❌ Não é possível deletar tema que está sendo usado por coleções')
      return
    }

    const confirmMessage = theme.isSystem 
      ? `🚨 PERIGO: Você está EXCLUINDO um tema de SISTEMA!\nIsso pode QUEBRAR a plataforma permanentemente.\n\nTema: "${theme.displayName}"\n\nTem ABSOLUTA CERTEZA?`
      : `Tem certeza que deseja deletar o tema "${theme.displayName}"?`

    if (!confirm(confirmMessage)) {
      return
    }

    // Segunda confirmação para temas do sistema
    if (theme.isSystem && !confirm('🔴 ÚLTIMA CONFIRMAÇÃO: Excluir tema de sistema pode ser IRREVERSÍVEL!\nDigite SIM no próximo prompt se tem certeza absoluta.')) {
      return
    }

    if (theme.isSystem) {
      const userInput = prompt('Digite "EXCLUIR TEMA SISTEMA" para confirmar:')
      if (userInput !== 'EXCLUIR TEMA SISTEMA') {
        alert('❌ Confirmação incorreta. Exclusão cancelada.')
        return
      }
    }

    try {
      const response = await fetch(`/api/admin/themes/${theme.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('✅ Tema deletado!')
        fetchThemes()
      } else {
        const errorData = await response.json()
        alert(`❌ Erro ao deletar: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting theme:', error)
      alert('❌ Erro ao deletar tema')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      emoji: '📚',
      colorClass: 'from-gray-500/20 to-slate-500/20',
      borderClass: 'border-gray-500/30'
    })
    setEditingTheme(null)
  }

  const handleColorChange = (colorOption: typeof COLOR_OPTIONS[0]) => {
    setFormData({
      ...formData,
      colorClass: colorOption.value,
      borderClass: colorOption.border
    })
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
            <span className="text-white">Gerenciar Temas</span>
          </div>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Gerenciar Temas</h1>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200 flex items-center space-x-2"
            >
              <span>🎨</span>
              <span>Novo Tema</span>
            </button>
          </div>

          {/* Themes Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <div key={theme.id} className={`bg-gradient-to-br ${theme.colorClass} backdrop-blur-lg rounded-lg p-6 border ${theme.borderClass}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{theme.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{theme.displayName}</h3>
                      <div className="text-sm text-gray-300">/{theme.name}</div>
                      {theme.isSystem && (
                        <div className="text-xs text-blue-400 mt-1">Sistema</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className={`px-2 py-1 rounded text-xs ${
                      theme.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {theme.isActive ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
                
                {theme.description && (
                  <p className="text-gray-300 text-sm mb-4">
                    {theme.description}
                  </p>
                )}
                
                <div className="text-sm text-gray-300 mb-4">
                  <span className="font-semibold">{theme._count.collections}</span> coleção(ões) usando
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(theme)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition duration-200"
                  >
                    ✏️ Editar
                  </button>
                  
                  <button
                    onClick={() => handleToggleStatus(theme)}
                    className={`flex-1 px-3 py-2 rounded text-sm transition duration-200 ${
                      theme.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {theme.isActive ? '🚫' : '✅'}
                  </button>
                  
                  {(!theme.isActive && theme._count.collections === 0) && (
                    <button
                      onClick={() => handleDelete(theme)}
                      className={`px-3 py-2 rounded text-sm transition duration-200 text-white ${
                        theme.isSystem 
                          ? 'bg-red-800 hover:bg-red-900' 
                          : 'bg-red-700 hover:bg-red-800'
                      }`}
                      title={theme.isSystem ? 'PERIGO: Excluir tema de sistema!' : 'Excluir tema'}
                    >
                      {theme.isSystem ? '💀' : '🗑️'}
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

      {/* Modal for Adding/Editing Themes */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingTheme ? `Editar Tema: ${editingTheme.displayName}` : 'Novo Tema'}
              {editingTheme?.isSystem && <span className="text-sm text-blue-400 ml-2">(Sistema)</span>}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Nome Interno: *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="medieval, fantasy, sci-fi"
                    disabled={editingTheme?.isSystem}
                    required
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Apenas letras minúsculas e hífens
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Nome de Exibição: *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Medieval, Fantasy, Ficção Científica"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Descrição:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrição do tema..."
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Emoji:</label>
                <div className="grid grid-cols-10 gap-2 mb-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({...formData, emoji})}
                      className={`p-2 text-xl rounded transition duration-200 ${
                        formData.emoji === emoji 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                  className="w-20 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="📚"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Cor do Tema:</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`p-3 rounded border-2 transition duration-200 ${
                        formData.colorClass === color.value
                          ? 'border-white bg-white/10'
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className={`w-full h-8 rounded bg-gradient-to-br ${color.value} border ${color.border} mb-1`}></div>
                      <div className="text-xs text-gray-300">{color.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-gray-300 mb-2">Preview:</label>
                <div className={`bg-gradient-to-br ${formData.colorClass} backdrop-blur-lg rounded-lg p-4 border ${formData.borderClass}`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{formData.emoji}</span>
                    <div>
                      <div className="text-lg font-bold text-white">{formData.displayName || 'Nome do Tema'}</div>
                      <div className="text-sm text-gray-300">/{formData.name || 'nome-interno'}</div>
                      {formData.description && (
                        <div className="text-sm text-gray-300 mt-1">{formData.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition duration-200"
                >
                  {editingTheme ? '✅ Atualizar' : '✅ Criar'}
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