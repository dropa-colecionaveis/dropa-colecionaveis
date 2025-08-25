'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getRarityName } from '@/lib/rarity-system'
import AutoSellPanel from '@/components/AutoSellPanel'
import { useUserRankings } from '@/hooks/useUserRankings'
import { useAdmin } from '@/hooks/useAdmin'
import { 
  InventoryStatsSkeleton, 
  InventoryFilterSkeleton, 
  InventoryGridSkeleton,
  HeaderStatsSkeleton
} from '@/components/SkeletonLoader'

// Fixed selling percentages by rarity (same as auto-sell system)
const FIXED_SELLING_PERCENTAGES = {
  COMUM: 30,      // 30% of 5 credits = 1.5 credits
  INCOMUM: 25,    // 25% of 15 credits = 3.75 credits  
  RARO: 20,       // 20% of 40 credits = 8 credits
  EPICO: 15,      // 15% of 100 credits = 15 credits
  LENDARIO: 10    // 10% of 500 credits = 50 credits
} as const

interface UserItem {
  id: string
  obtainedAt: string
  item: {
    id: string
    name: string
    description: string
    rarity: string
    value: number
    imageUrl: string
    collection?: {
      id: string
      name: string
      theme?: {
        name: string
        displayName: string
        emoji: string
      }
      customTheme?: string
    } | null
  }
  limitedEdition?: {
    id: string
    serialNumber: number
    mintedAt: string
    item: {
      maxEditions: number | null
      currentEditions: number
    }
  }
  marketplaceListings?: Array<{
    id: string
    price: number
    description?: string
    status: string
    createdAt: string
  }>
}

interface InventoryStats {
  totalItems: number
  totalValue: number
  rarityBreakdown: Record<string, number>
}

export default function Inventory() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userItems, setUserItems] = useState<UserItem[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalValue: 0,
    rarityBreakdown: {}
  })
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<UserItem['item'] | null>(null)
  const [listingItem, setListingItem] = useState<UserItem | null>(null)
  const [listingPrice, setListingPrice] = useState<string>('')
  const [listingDescription, setListingDescription] = useState<string>('')
  const [listing, setListing] = useState(false)
  const [priceWarning, setPriceWarning] = useState<string>('')
  const [priceRange, setPriceRange] = useState<{min: number, max: number} | null>(null)
  const [showAutoSell, setShowAutoSell] = useState(false)
  const [autoSelling, setAutoSelling] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { bestRanking, loading: rankingLoading } = useUserRankings()
  const { isAdmin, isSuperAdmin } = useAdmin()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      setLoading(false) // Auth is complete, start showing skeleton
      fetchInventory()
      fetchUserProfile()
    }
  }, [status, router])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/user/inventory')
      if (response.ok) {
        const data = await response.json()
        setUserItems(data.items)
        calculateStats(data.items)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setInventoryLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/stats')
      ])
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUserProfile(profileData)
      }
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const calculateStats = (items: UserItem[]) => {
    const totalItems = items.length
    const totalValue = items.reduce((sum, userItem) => sum + userItem.item.value, 0)
    const rarityBreakdown: Record<string, number> = {}

    items.forEach(userItem => {
      const rarity = userItem.item.rarity
      rarityBreakdown[rarity] = (rarityBreakdown[rarity] || 0) + 1
    })

    setStats({ totalItems, totalValue, rarityBreakdown })
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

  const getFilteredItems = () => {
    if (selectedRarity === 'ALL') {
      return userItems
    }
    return userItems.filter(userItem => userItem.item.rarity === selectedRarity)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Price validation function
  const validatePrice = (price: string, baseValue: number) => {
    const numPrice = parseFloat(price)
    if (!numPrice || numPrice <= 0) {
      setPriceWarning('')
      return
    }

    const ratio = numPrice / baseValue
    if (ratio < 0.1) {
      setPriceWarning('⚠️ Preço muito baixo - pode ser rejeitado')
    } else if (ratio > 10) {
      setPriceWarning('⚠️ Preço muito alto - pode ser rejeitado')
    } else if (ratio > 5) {
      setPriceWarning('⚠️ Preço suspeito - será analisado')
    } else if (ratio < 0.2) {
      setPriceWarning('⚠️ Preço abaixo do recomendado')
    } else {
      setPriceWarning('')
    }
  }

  const handleListOnMarketplace = async () => {
    if (!listingItem || !listingPrice || parseFloat(listingPrice) <= 0) return

    setListing(true)
    try {
      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userItemId: listingItem.id,
          price: parseFloat(listingPrice),
          description: listingDescription
        })
      })

      const data = await response.json()

      if (response.ok) {
        let message = 'Item listado no marketplace com sucesso!'
        if (data.warnings && data.warnings.length > 0) {
          message += `\n\nAvisos:\n${data.warnings.join('\n')}`
        }
        alert(message)
        setListingItem(null)
        setListingPrice('')
        setListingDescription('')
        setPriceWarning('')
        setPriceRange(null)
        // Don't show loading state for refresh, just update data
        const response = await fetch('/api/user/inventory')
        if (response.ok) {
          const data = await response.json()
          setUserItems(data.items)
          calculateStats(data.items)
        }
      } else {
        let errorMessage = data.error || 'Erro ao listar item'
        
        if (data.waitTime) {
          errorMessage += `\n\nAguarde ${data.waitTime} minutos antes de tentar novamente.`
        }
        
        if (data.suggestedRange) {
          setPriceRange(data.suggestedRange)
          errorMessage += `\n\nFaixa de preço sugerida: ${data.suggestedRange.min} - ${data.suggestedRange.max} créditos`
        }

        if (data.reasons && data.reasons.length > 0) {
          errorMessage += `\n\nMotivos:\n${data.reasons.join('\n')}`
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error listing item:', error)
      alert('Erro ao listar item')
    } finally {
      setListing(false)
    }
  }

  const startListing = (userItem: UserItem) => {
    setListingItem(userItem)
    setListingPrice(userItem.item.value.toString()) // Start with item's base value
    setListingDescription('')
  }

  const isItemListed = (userItem: UserItem) => {
    return userItem.marketplaceListings && userItem.marketplaceListings.length > 0
  }

  // Calcular preço de auto-sell usando percentuais fixos
  const calculateAutoSellPrice = (baseValue: number, rarity: string): number => {
    const percentage = FIXED_SELLING_PERCENTAGES[rarity as keyof typeof FIXED_SELLING_PERCENTAGES] || 30
    const calculatedPrice = baseValue * (percentage / 100)
    return Math.max(1, Math.ceil(calculatedPrice))
  }

  // Processar venda automática individual
  const handleAutoSellItem = async () => {
    if (!listingItem) return

    setAutoSelling(true)
    try {
      const response = await fetch(`/api/user/auto-sell/item/${listingItem.id}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}\n\nVocê recebeu ${data.creditsReceived} créditos.`)
        setListingItem(null)
        // Don't show loading state for refresh, just update data
        const response = await fetch('/api/user/inventory')
        if (response.ok) {
          const refreshData = await response.json()
          setUserItems(refreshData.items)
          calculateStats(refreshData.items)
        }
      } else {
        alert(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Error auto-selling item:', error)
      alert('❌ Erro ao vender item automaticamente')
    } finally {
      setAutoSelling(false)
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/Dropa!.png"
                  alt="Dropa!"
                  width={120}
                  height={60}
                  className="drop-shadow-lg filter drop-shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform duration-300"
                  priority
                />
              </Link>
              
              {/* Page Title */}
              <div className="hidden md:block">
                <div className="text-white font-medium">
                  🎒 <span className="text-purple-300">Meu Inventário</span>
                </div>
                <div className="text-gray-400 text-sm">Sua coleção pessoal de itens digitais</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-4">
              {profileLoading ? (
                <HeaderStatsSkeleton />
              ) : (
                <>
                  {/* Level and XP */}
                  {userStats && (
                    <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-purple-400/30 hover:border-purple-300/50 transition-colors duration-200">
                      <Link href="/achievements" className="flex items-center space-x-3 group">
                        <div className="text-center">
                          <div className="text-purple-300 font-bold text-sm group-hover:text-purple-200 transition-colors">⭐ Nível {userStats.level || 1}</div>
                          <div className="text-xs text-gray-300 group-hover:text-purple-200 transition-colors">{userStats.totalXP || 0} XP</div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* User Ranking */}
                  {!rankingLoading && bestRanking.position > 0 && (
                    <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-indigo-400/30 hover:border-indigo-300/50 transition-colors duration-200">
                      <Link href="/rankings" className="flex items-center space-x-3 group">
                        <div className="text-center">
                          <div className="text-indigo-300 font-bold text-sm flex items-center">
                            <span className="mr-1">📊</span>
                            <span>#{bestRanking.position}</span>
                            <span className="ml-1 text-xs opacity-75">({Math.round(bestRanking.percentage)}%)</span>
                          </div>
                          <div className="text-xs text-gray-300 group-hover:text-indigo-200 transition-colors">
                            Ranking Global
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}
                  
                  {/* Credits */}
                  <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-yellow-400/30 hover:border-yellow-300/50 transition-colors duration-200">
                    <Link href="/credits/purchase" className="flex items-center space-x-2 group">
                      <span className="text-yellow-300 text-lg group-hover:scale-110 transition-transform duration-200">💰</span>
                      <div>
                        <div className="text-yellow-300 font-bold group-hover:text-yellow-200 transition-colors">{userProfile?.credits || 0}</div>
                        <div className="text-xs text-yellow-200 group-hover:text-yellow-100 transition-colors">créditos</div>
                      </div>
                    </Link>
                  </div>
                </>
              )}
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                {/* Admin Link */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="p-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105"
                    title={isSuperAdmin ? "Super Admin" : "Admin"}
                  >
                    {isSuperAdmin ? '👑' : '🔧'}
                  </Link>
                )}
                
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="p-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                  title="Sair"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
              <h1 className="text-4xl font-bold text-white mb-4 sm:mb-0 flex items-center">
                <span className="mr-3">🎒</span>
                Meu Inventário
              </h1>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAutoSell(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span>🤖</span>
                  <span>Venda em Lote</span>
                </button>
                <Link
                  href="/collections"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span>📚</span>
                  <span>Ver Coleções</span>
                </Link>
              </div>
            </div>
            <p className="text-gray-300">
              Sua coleção pessoal de itens digitais
            </p>
          </div>

          {/* Stats Cards */}
          {inventoryLoading ? (
            <InventoryStatsSkeleton />
          ) : (
            <div className="grid md:grid-cols-4 gap-6 mb-8 animate-fadeIn">
              <div className="group bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-bounce">📊</div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalItems}</div>
                <div className="text-sm text-gray-300">Total de Itens</div>
              </div>
              
              <div className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">💰</div>
                <div className="text-3xl font-bold text-green-400 mb-1">{stats.totalValue}</div>
                <div className="text-sm text-gray-300">Valor Total</div>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-spin">🌈</div>
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {Object.keys(stats.rarityBreakdown).length}
                </div>
                <div className="text-sm text-gray-300">Tipos de Raridade</div>
              </div>
              
              <div className="group bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse group-hover:scale-110 transition-transform duration-300">⭐</div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {(stats.rarityBreakdown['LENDARIO'] || 0) + 
                   (stats.rarityBreakdown['EPICO'] || 0) + 
                   (stats.rarityBreakdown['RARO'] || 0)}
                </div>
                <div className="text-sm text-gray-300">Itens Raros+</div>
              </div>
            </div>
          )}

          {/* Rarity Filter */}
          {inventoryLoading ? (
            <InventoryFilterSkeleton />
          ) : (
            <div className="mb-8 animate-fadeIn">
              <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
                <span className="mr-2">🔍</span>
                Filtrar por Raridade
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setSelectedRarity('ALL')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold ${
                    selectedRarity === 'ALL' 
                      ? 'bg-gradient-to-r from-white/30 to-gray-300/30 text-white border-2 border-white/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-2 border-transparent'
                  }`}
                >
                  🌟 Todos ({stats.totalItems})
                </button>
                
                {Object.entries(stats.rarityBreakdown).map(([rarity, count]) => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                      selectedRarity === rarity
                        ? getRarityColor(rarity) + ' border-current'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                    }`}
                  >
                    {getRarityName(rarity)} ({count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Items Grid */}
          {inventoryLoading ? (
            <InventoryGridSkeleton />
          ) : filteredItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
              {filteredItems.map((userItem) => (
                <div
                  key={userItem.id}
                  className={`bg-white/10 backdrop-blur-lg rounded-lg p-6 border-2 ${getRarityColor(userItem.item.rarity)}`}
                >
                  <div className="text-center mb-4">
                    <div className="relative group">
                      <div 
                        className="w-32 h-32 mx-auto bg-gray-700 rounded-xl mb-4 flex items-center justify-center text-4xl overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-lg"
                        onClick={() => {
                          setSelectedItem(userItem.item)
                          setSelectedImage(userItem.item.imageUrl || '/items/default.jpg')
                        }}
                      >
                        {userItem.item.imageUrl && userItem.item.imageUrl !== '/items/default.jpg' ? (
                          <img 
                            src={userItem.item.imageUrl} 
                            alt={userItem.item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.innerHTML = '🏆'
                            }}
                          />
                        ) : (
                          <span className="text-4xl">🏆</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItem(userItem.item)
                          setSelectedImage(userItem.item.imageUrl || '/items/default.jpg')
                        }}
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                    
                    <h3 className={`text-lg font-bold mb-1 ${getRarityColor(userItem.item.rarity).split(' ')[0]}`}>
                      {userItem.item.name}
                      {userItem.limitedEdition && (
                        <span className="text-purple-400 ml-1">
                          🏆 #{userItem.limitedEdition.serialNumber}
                        </span>
                      )}
                    </h3>
                    
                    <p className="text-gray-300 text-sm mb-3">
                      {userItem.item.description}
                    </p>
                    
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 ${getRarityColor(userItem.item.rarity)}`}>
                      {getRarityName(userItem.item.rarity)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-gray-300">
                      <span>Valor:</span>
                      <span className="text-green-400 font-semibold">
                        {userItem.item.value} créditos
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-gray-300">
                      <span>Obtido em:</span>
                      <span>{formatDate(userItem.obtainedAt)}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-300">
                      <span>Coleção:</span>
                      <span className="text-blue-400">
                        {userItem.item.collection?.theme?.emoji || '📚'} {userItem.item.collection?.name}
                      </span>
                    </div>

                    {userItem.limitedEdition && (
                      <div className="flex justify-between text-gray-300">
                        <span>Edição Limitada:</span>
                        <span className="text-purple-400 font-semibold">
                          #{userItem.limitedEdition.serialNumber}/{userItem.limitedEdition.item.maxEditions || '∞'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Marketplace Status */}
                  {isItemListed(userItem) && (
                    <div className="mb-4 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="text-green-400 text-xs font-semibold text-center">
                        📈 Listado no Marketplace
                      </div>
                      <div className="text-green-400 text-xs text-center">
                        {userItem.marketplaceListings![0].price} créditos
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {userItem.item.collection && (
                      <Link
                        href={`/collections/${userItem.item.collection.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs text-center transition duration-200"
                      >
                        Ver Coleção
                      </Link>
                    )}
                    
                    {!isItemListed(userItem) && (
                      <button
                        onClick={() => startListing(userItem)}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs text-center transition duration-200"
                      >
                        Vender
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              {userItems.length === 0 ? (
                <div>
                  <div className="text-6xl mb-4">📦</div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Seu inventário está vazio
                  </h2>
                  <p className="text-gray-300 mb-8">
                    Que tal abrir seu primeiro pacote?
                  </p>
                  <Link
                    href="/packs"
                    className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-200"
                  >
                    Ir para Loja de Pacotes
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Nenhum item encontrado
                  </h2>
                  <p className="text-gray-300 mb-8">
                    Não há itens da raridade selecionada em seu inventário.
                  </p>
                  <button
                    onClick={() => setSelectedRarity('ALL')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
                  >
                    Ver Todos os Itens
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && selectedItem && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => {
            setSelectedImage(null)
            setSelectedItem(null)
          }}
        >
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-80 h-80 mx-auto bg-gray-700 rounded-xl mb-6 flex items-center justify-center overflow-hidden shadow-2xl">
                {selectedImage && selectedImage !== '/items/default.jpg' ? (
                  <img 
                    src={selectedImage} 
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement!
                      parent.innerHTML = '<span class="text-8xl">🏆</span>'
                    }}
                  />
                ) : (
                  <span className="text-8xl">🏆</span>
                )}
              </div>
              
              <h3 className={`text-3xl font-bold mb-3 ${getRarityColor(selectedItem.rarity).split(' ')[0]}`}>
                {selectedItem.name}
                {filteredItems.find(item => item.item.id === selectedItem.id)?.limitedEdition && (
                  <span className="text-purple-400 ml-2">
                    🏆 #{filteredItems.find(item => item.item.id === selectedItem.id)?.limitedEdition?.serialNumber}
                  </span>
                )}
              </h3>
              
              <p className="text-gray-300 mb-4 text-lg">
                {selectedItem.description}
              </p>
              
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${getRarityColor(selectedItem.rarity)}`}>
                {getRarityName(selectedItem.rarity)}
              </div>
              
              <div className="text-green-400 font-bold text-xl mb-4">
                {selectedItem.value} créditos
              </div>
              
              {/* Collection Info */}
              {filteredItems.find(item => item.item.id === selectedItem.id)?.item.collection && (
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="text-gray-300 text-sm mb-2">Da Coleção:</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {filteredItems.find(item => item.item.id === selectedItem.id)?.item.collection?.theme?.emoji || '📚'}
                      </span>
                      <span className="text-white font-semibold">
                        {filteredItems.find(item => item.item.id === selectedItem.id)?.item.collection?.name}
                      </span>
                    </div>
                    <Link
                      href={`/collections/${filteredItems.find(item => item.item.id === selectedItem.id)?.item.collection?.id}`}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      onClick={() => {
                        setSelectedImage(null)
                        setSelectedItem(null)
                      }}
                    >
                      Ver Coleção
                    </Link>
                  </div>
                </div>
              )}

              {/* Limited Edition Info */}
              {filteredItems.find(item => item.item.id === selectedItem.id)?.limitedEdition && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                  <div className="text-purple-400 font-semibold text-sm mb-2 flex items-center">
                    <span className="mr-2">🏆</span>
                    Edição Limitada
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Número da Edição:</span>
                      <span className="text-purple-400 font-bold">
                        #{filteredItems.find(item => item.item.id === selectedItem.id)?.limitedEdition?.serialNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total de Edições:</span>
                      <span className="text-purple-400 font-bold">
                        {filteredItems.find(item => item.item.id === selectedItem.id)?.limitedEdition?.item.maxEditions || '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Criado em:</span>
                      <span className="text-purple-400 font-bold">
                        {filteredItems.find(item => item.item.id === selectedItem.id)?.limitedEdition?.mintedAt && 
                         formatDate(filteredItems.find(item => item.item.id === selectedItem.id)!.limitedEdition!.mintedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedImage(null)
                    setSelectedItem(null)
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Listing Modal */}
      {listingItem && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto" 
          onClick={() => {
            setListingItem(null)
            setPriceWarning('')
            setPriceRange(null)
          }}
        >
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
              Opções de Venda
            </h3>
            
            {/* Item Preview */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-24 h-24 mx-auto bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {listingItem.item.imageUrl && listingItem.item.imageUrl !== '/items/default.jpg' ? (
                  <img 
                    src={listingItem.item.imageUrl} 
                    alt={listingItem.item.name}
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
              <h4 className={`text-lg font-bold ${getRarityColor(listingItem.item.rarity).split(' ')[0]}`}>
                {listingItem.item.name}
                {listingItem.limitedEdition && (
                  <span className="text-purple-400 ml-1">
                    🏆 #{listingItem.limitedEdition.serialNumber}
                  </span>
                )}
              </h4>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getRarityColor(listingItem.item.rarity)}`}>
                {getRarityName(listingItem.item.rarity)}
              </div>
              <div className="text-gray-300 text-sm mt-2">
                Valor base: {listingItem.item.value} créditos
              </div>
            </div>

            {/* Auto-Sell Section */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h4 className="text-green-400 font-semibold text-lg mb-3 flex items-center">
                <span className="mr-2">🤖</span>
                Venda Automática
              </h4>
              <p className="text-gray-300 text-sm mb-3">
                Venda instantânea pelo sistema usando valores fixos (sem taxas).
              </p>
              <div className="bg-white/10 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Preço de venda:</span>
                  <span className="text-green-400 font-bold">
                    {calculateAutoSellPrice(listingItem.item.value, listingItem.item.rarity)} créditos
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-300 text-xs">
                    Percentual ({FIXED_SELLING_PERCENTAGES[listingItem.item.rarity as keyof typeof FIXED_SELLING_PERCENTAGES]}%):
                  </span>
                  <span className="text-gray-400 text-xs">
                    {listingItem.item.value} × {FIXED_SELLING_PERCENTAGES[listingItem.item.rarity as keyof typeof FIXED_SELLING_PERCENTAGES]}%
                  </span>
                </div>
              </div>
              <button
                onClick={handleAutoSellItem}
                disabled={autoSelling}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
              >
                {autoSelling ? '🤖 Vendendo...' : '🤖 Vender Automaticamente'}
              </button>
            </div>

            {/* Marketplace Section */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h4 className="text-purple-400 font-semibold text-lg mb-3 flex items-center">
                <span className="mr-2">🏪</span>
                Marketplace
              </h4>
              <p className="text-gray-300 text-sm mb-4">
                Liste seu item para outros jogadores comprarem (taxa de 5%).
              </p>
            
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    Preço de venda (créditos)
                  </label>
                  <input
                    type="number"
                    value={listingPrice}
                    onChange={(e) => {
                      setListingPrice(e.target.value)
                      validatePrice(e.target.value, listingItem.item.value)
                    }}
                    min="1"
                    className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      priceWarning 
                        ? 'border-yellow-500 focus:ring-yellow-500' 
                        : 'border-white/20 focus:ring-purple-500'
                    }`}
                    placeholder="Digite o preço..."
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Taxa do marketplace: 5% (você receberá {listingPrice ? Math.floor(parseFloat(listingPrice) * 0.95) : 0} créditos)
                  </div>
                  {priceWarning && (
                    <div className="text-xs text-yellow-400 mt-1 flex items-center space-x-1">
                      <span>{priceWarning}</span>
                    </div>
                  )}
                  {priceRange && (
                    <div className="text-xs text-blue-400 mt-1">
                      💡 Faixa recomendada: {priceRange.min} - {priceRange.max} créditos
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={listingDescription}
                    onChange={(e) => setListingDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Descreva seu item para atrair compradores..."
                  />
                </div>
                
                <button
                  onClick={handleListOnMarketplace}
                  disabled={listing || !listingPrice || parseFloat(listingPrice) <= 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
                >
                  {listing ? 'Listando...' : '🏪 Listar no Marketplace'}
                </button>
              </div>
            </div>
            
            <div className="flex justify-center mt-4 sm:mt-6 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setListingItem(null)
                  setPriceWarning('')
                  setPriceRange(null)
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 sm:py-3 rounded-lg transition-colors font-semibold text-sm sm:text-base"
              >
                ✕ Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Sell Panel */}
      <AutoSellPanel isOpen={showAutoSell} onClose={() => setShowAutoSell(false)} />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Saída</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja sair da sua conta?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}