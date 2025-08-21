'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRarityName } from '@/lib/rarity-system'

interface Item {
  id: string
  name: string
  description: string | null
  rarity: string
  value: number
  imageUrl: string
  itemNumber: number
  isOwned: boolean
  obtainedAt: string | null
  limitedEdition?: {
    id: string
    serialNumber: number
    mintedAt: string
    item: {
      maxEditions: number | null
      currentEditions: number
    }
  }
}

interface CollectionProgress {
  itemsOwned: number
  totalItems: number
  progressPercentage: number
  isCompleted: boolean
  completedAt: string | null
  rarityBreakdown: {
    owned: Record<string, number>
    total: Record<string, number>
  }
}

interface CollectionDetail {
  id: string
  name: string
  description: string | null
  theme: string | null
  imageUrl: string | null
  maxItems: number
  isLimited: boolean
  createdAt: string
  progress: CollectionProgress
  items: Item[]
}

export default function CollectionDetail({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [collection, setCollection] = useState<CollectionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchCollection()
    }
  }, [status, router, params.id])

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/user/collections/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCollection(data)
      } else if (response.status === 404) {
        router.push('/collections')
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'text-gray-400 bg-gray-500/20 border-gray-500'
      case 'INCOMUM': return 'text-green-400 bg-green-500/20 border-green-500'
      case 'RARO': return 'text-blue-400 bg-blue-500/20 border-blue-500'
      case 'EPICO': return 'text-purple-400 bg-purple-500/20 border-purple-500'
      case 'LENDARIO': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500'
    }
  }

  const getThemeColor = (theme: string | null | undefined) => {
    if (!theme) return 'from-gray-500/20 to-slate-500/20'
    
    switch (theme.toLowerCase()) {
      case 'medieval': return 'from-amber-500/20 to-orange-500/20'
      case 'fantasy': return 'from-purple-500/20 to-pink-500/20'
      case 'classic': return 'from-blue-500/20 to-cyan-500/20'
      case 'sci-fi': return 'from-green-500/20 to-emerald-500/20'
      default: return 'from-gray-500/20 to-slate-500/20'
    }
  }

  const getThemeEmoji = (theme: string | null | undefined) => {
    if (!theme) return '📚'
    
    switch (theme.toLowerCase()) {
      case 'medieval': return '⚔️'
      case 'fantasy': return '🧙‍♂️'
      case 'classic': return '💎'
      case 'sci-fi': return '🚀'
      case 'mythological': return '🐉'
      case 'modern': return '🏢'
      default: return '📚'
    }
  }

  const getFilteredItems = () => {
    if (selectedRarity === 'ALL') {
      return collection?.items || []
    }
    if (selectedRarity === 'OWNED') {
      return collection?.items.filter(item => item.isOwned) || []
    }
    if (selectedRarity === 'MISSING') {
      return collection?.items.filter(item => !item.isOwned) || []
    }
    return collection?.items.filter(item => item.rarity === selectedRarity) || []
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">Coleção não encontrada</h2>
          <Link href="/collections" className="text-blue-400 hover:text-blue-300">
            ← Voltar às Coleções
          </Link>
        </div>
      </div>
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-white">
            Colecionáveis Digitais
          </Link>
          <div className="text-white">
            Olá, {session?.user?.name || session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Collection Header */}
          <div className={`bg-gradient-to-br ${getThemeColor(collection.theme)} backdrop-blur-lg rounded-lg p-8 mb-8`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <span className="text-4xl">{getThemeEmoji(collection.theme)}</span>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                    {collection.isLimited && (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full">
                        Limitada ⭐
                      </span>
                    )}
                    {collection.progress.isCompleted && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                        Completa ✅
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 capitalize">{collection.theme || 'Sem tema'}</p>
                  {collection.description && (
                    <p className="text-gray-300 mt-2">{collection.description}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">
                  {Math.min(collection.progress.progressPercentage, 100)}%
                </div>
                <div className="text-gray-300 text-sm">
                  {collection.progress.itemsOwned}/{collection.progress.totalItems} itens
                </div>
                {collection.progress.completedAt && (
                  <div className="text-green-400 text-xs mt-1">
                    Completa em {formatDate(collection.progress.completedAt)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    collection.progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.min(collection.progress.progressPercentage, 100)}%`,
                    maxWidth: '100%'
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            {Object.entries(collection.progress.rarityBreakdown.total).map(([rarity, total]) => {
              const owned = collection.progress.rarityBreakdown.owned[rarity] || 0
              const percentage = total > 0 ? Math.round((owned / total) * 100) : 0
              
              return (
                <div key={rarity} className={`backdrop-blur-lg rounded-lg p-4 border-2 ${getRarityColor(rarity)}`}>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${getRarityColor(rarity).split(' ')[0]}`}>
                      {owned}/{total}
                    </div>
                    <div className="text-xs text-gray-300 mb-2">
                      {getRarityName(rarity)}
                    </div>
                    <div className={`text-sm font-semibold ${getRarityColor(rarity).split(' ')[0]}`}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filter Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRarity('ALL')}
                className={`px-4 py-2 rounded-lg transition duration-200 ${
                  selectedRarity === 'ALL' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/15'
                }`}
              >
                Todos ({collection.items.length})
              </button>
              
              <button
                onClick={() => setSelectedRarity('OWNED')}
                className={`px-4 py-2 rounded-lg transition duration-200 ${
                  selectedRarity === 'OWNED' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/15'
                }`}
              >
                Possuídos ({collection.progress.itemsOwned})
              </button>
              
              <button
                onClick={() => setSelectedRarity('MISSING')}
                className={`px-4 py-2 rounded-lg transition duration-200 ${
                  selectedRarity === 'MISSING' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/15'
                }`}
              >
                Faltam ({collection.progress.totalItems - collection.progress.itemsOwned})
              </button>
              
              {Object.entries(collection.progress.rarityBreakdown.total).map(([rarity, total]) => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`px-4 py-2 rounded-lg transition duration-200 ${
                    selectedRarity === rarity
                      ? getRarityColor(rarity).split(' ')[1] + ' ' + getRarityColor(rarity).split(' ')[0]
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {getRarityName(rarity)} ({total})
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`backdrop-blur-lg rounded-lg p-4 border-2 transition-all duration-200 cursor-pointer hover:scale-105 ${
                  item.isOwned 
                    ? getRarityColor(item.rarity)
                    : 'bg-gray-800/50 border-gray-600 opacity-60'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="text-center">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 mx-auto bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.imageUrl && item.imageUrl !== '/items/default.jpg' ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className={`w-full h-full object-cover ${!item.isOwned ? 'grayscale' : ''}`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.parentElement!.innerHTML = item.isOwned ? '🏆' : '❓'
                          }}
                        />
                      ) : (
                        <span className="text-2xl">{item.isOwned ? '🏆' : '❓'}</span>
                      )}
                    </div>
                    
                    <div className="absolute -top-1 -right-1 text-xs bg-gray-800 text-white px-1 rounded">
                      #{item.itemNumber}
                    </div>
                    
                    {!item.isOwned && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <span className="text-white text-2xl">🔒</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`text-sm font-bold mb-1 ${item.isOwned ? getRarityColor(item.rarity).split(' ')[0] : 'text-gray-500'}`}>
                    {item.isOwned ? item.name : '???'}
                    {item.isOwned && item.limitedEdition && (
                      <span className="text-purple-400 ml-1 text-xs">
                        🏆#{item.limitedEdition.serialNumber}
                      </span>
                    )}
                  </h3>
                  
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    item.isOwned ? getRarityColor(item.rarity) : 'bg-gray-700 text-gray-400'
                  }`}>
                    {getRarityName(item.rarity)}
                  </div>
                  
                  {item.isOwned && item.obtainedAt && (
                    <div className="text-xs text-gray-400 mt-2">
                      {formatDate(item.obtainedAt)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/collections"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar às Coleções
            </Link>
          </div>
        </div>
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className={`backdrop-blur-lg rounded-2xl p-6 max-w-md w-full mx-4 border-2 ${getRarityColor(selectedItem.rarity)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-40 h-40 mx-auto bg-gray-700 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                {selectedItem.imageUrl && selectedItem.imageUrl !== '/items/default.jpg' ? (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.name}
                    className={`w-full h-full object-cover ${!selectedItem.isOwned ? 'grayscale' : ''}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement!
                      parent.innerHTML = `<span class="text-6xl">${selectedItem.isOwned ? '🏆' : '❓'}</span>`
                    }}
                  />
                ) : (
                  <span className="text-6xl">{selectedItem.isOwned ? '🏆' : '❓'}</span>
                )}
              </div>
              
              <div className="mb-2 text-gray-400">#{selectedItem.itemNumber} na coleção</div>
              
              <h3 className={`text-2xl font-bold mb-3 ${getRarityColor(selectedItem.rarity).split(' ')[0]}`}>
                {selectedItem.isOwned ? selectedItem.name : 'Item Não Possuído'}
                {selectedItem.isOwned && selectedItem.limitedEdition && (
                  <span className="text-purple-400 ml-2">
                    🏆 #{selectedItem.limitedEdition.serialNumber}
                  </span>
                )}
              </h3>
              
              {selectedItem.isOwned && selectedItem.description && (
                <p className="text-gray-300 mb-4">
                  {selectedItem.description}
                </p>
              )}
              
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${getRarityColor(selectedItem.rarity)}`}>
                {getRarityName(selectedItem.rarity)}
              </div>
              
              {selectedItem.isOwned && (
                <>
                  <div className="text-green-400 font-bold text-xl mb-4">
                    {selectedItem.value} créditos
                  </div>
                  
                  {selectedItem.limitedEdition && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4">
                      <div className="text-purple-400 font-semibold text-sm mb-2 flex items-center">
                        <span className="mr-2">🏆</span>
                        Edição Limitada
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Número:</span>
                          <span className="text-purple-400 font-bold">#{selectedItem.limitedEdition.serialNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total:</span>
                          <span className="text-purple-400 font-bold">{selectedItem.limitedEdition.item.maxEditions || '∞'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Criado:</span>
                          <span className="text-purple-400 font-bold">{formatDate(selectedItem.limitedEdition.mintedAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedItem.obtainedAt && (
                    <div className="text-gray-400 text-sm mb-6">
                      Obtido em {formatDate(selectedItem.obtainedAt)}
                    </div>
                  )}
                </>
              )}
              
              {!selectedItem.isOwned && (
                <div className="text-gray-400 text-sm mb-6">
                  Continue abrindo pacotes para descobrir este item!
                </div>
              )}
              
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}