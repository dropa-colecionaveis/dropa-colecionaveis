'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getRarityName } from '@/lib/rarity-system'
import { useUserRankings } from '@/hooks/useUserRankings'
import { useAdmin } from '@/hooks/useAdmin'

interface MarketplaceListing {
  id: string
  price: number
  description?: string
  status: string
  createdAt: string
  userItem: {
    id: string
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
      item: {
        maxEditions: number | null
        currentEditions: number
      }
    }
  }
  seller: {
    id: string
    name: string
    email: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function Marketplace() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { bestRanking, loading: rankingLoading } = useUserRankings()
  const { isAdmin, isSuperAdmin } = useAdmin()
  
  // Filters
  const [selectedRarity, setSelectedRarity] = useState<string>('')
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [sort, setSort] = useState<string>('createdAt')
  const [order, setOrder] = useState<string>('desc')

  // Modal
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [confirmPurchase, setConfirmPurchase] = useState<MarketplaceListing | null>(null)
  const [userCredits, setUserCredits] = useState<number>(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchListings()
      fetchUserProfile()
    }
  }, [status, router, pagination.page, selectedRarity, selectedCollection, minPrice, maxPrice, search, sort, order])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort,
        order
      })

      if (selectedRarity) params.append('rarity', selectedRarity)
      if (selectedCollection) params.append('collection', selectedCollection)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (search) params.append('search', search)

      const response = await fetch(`/api/marketplace/listings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching marketplace listings:', error)
    } finally {
      setLoading(false)
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
        setUserCredits(profileData.credits || 0)
      }
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.credits || 0)
      }
    } catch (error) {
      console.error('Error fetching user credits:', error)
    }
  }

  const handlePurchaseClick = (listing: MarketplaceListing) => {
    setConfirmPurchase(listing)
    fetchUserCredits() // Buscar créditos atuais quando abrir a modal
  }

  const handleConfirmPurchase = async () => {
    if (!session?.user?.id || !confirmPurchase) return

    setPurchasing(confirmPurchase.id)
    try {
      const response = await fetch(`/api/marketplace/purchase/${confirmPurchase.id}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Item purchased successfully! ${data.details.itemName} - ${data.details.price} credits`)
        fetchListings() // Refresh listings
        setSelectedListing(null)
        setConfirmPurchase(null)
      } else {
        alert(data.error || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed')
    } finally {
      setPurchasing(null)
      setConfirmPurchase(null)
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

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
                  🛒 <span className="text-purple-300">Marketplace</span>
                </div>
                <div className="text-gray-400 text-sm">Compre e venda itens colecionáveis únicos</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-4">
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
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="mr-3">🛒</span>
              Marketplace
            </h1>
            <p className="text-gray-300 text-lg">
              Compre e venda itens colecionáveis únicos de outros jogadores
            </p>
          </div>


          {/* Filters */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center">
              <span className="mr-2">🔍</span>
              Filtros de Busca
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buscar item
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome do item..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Raridade
                </label>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-800 [&>option]:text-white [&>option]:py-2"
                >
                  <option value="" className="bg-gray-800 text-white">Todas</option>
                  <option value="COMUM" className="bg-gray-800 text-white">Comum</option>
                  <option value="INCOMUM" className="bg-gray-800 text-white">Incomum</option>
                  <option value="RARO" className="bg-gray-800 text-white">Raro</option>
                  <option value="EPICO" className="bg-gray-800 text-white">Épico</option>
                  <option value="LENDARIO" className="bg-gray-800 text-white">Lendário</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preço mín.
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preço máx.
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="999999"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Ordenar por:</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value="createdAt" className="bg-gray-800 text-white">Data</option>
                  <option value="price" className="bg-gray-800 text-white">Preço</option>
                </select>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value="asc" className="bg-gray-800 text-white">Crescente</option>
                  <option value="desc" className="bg-gray-800 text-white">Decrescente</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSelectedRarity('')
                  setSelectedCollection('')
                  setMinPrice('')
                  setMaxPrice('')
                  setSearch('')
                  setSort('createdAt')
                  setOrder('desc')
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              >
                🗑️ Limpar Filtros
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          {listings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className={`group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 ${getRarityColor(listing.userItem.item.rarity)} cursor-pointer hover:bg-white/15 transition-all duration-300 hover:transform hover:scale-105 shadow-xl hover:shadow-2xl`}
                  onClick={() => setSelectedListing(listing)}
                >
                  <div className="text-center mb-4">
                    <div className="w-32 h-32 mx-auto bg-gray-700 rounded-xl mb-4 flex items-center justify-center text-4xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                      {listing.userItem.item.imageUrl && listing.userItem.item.imageUrl !== '/items/default.jpg' ? (
                        <img 
                          src={listing.userItem.item.imageUrl} 
                          alt={listing.userItem.item.name}
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
                    
                    <h3 className={`text-lg font-bold mb-1 ${getRarityColor(listing.userItem.item.rarity).split(' ')[0]}`}>
                      {listing.userItem.item.name}
                      {listing.userItem.limitedEdition && (
                        <span className="text-purple-400 ml-1">
                          🏆 #{listing.userItem.limitedEdition.serialNumber}
                        </span>
                      )}
                    </h3>
                    
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 ${getRarityColor(listing.userItem.item.rarity)}`}>
                      {getRarityName(listing.userItem.item.rarity)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-gray-300">
                      <span>Preço:</span>
                      <span className="text-green-400 font-semibold text-lg">
                        {listing.price} créditos
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-gray-300">
                      <span>Vendedor:</span>
                      <span className="text-blue-400">
                        {listing.seller.name || listing.seller.email}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-gray-300">
                      <span>Coleção:</span>
                      <span className="text-blue-400">
                        {listing.userItem.item.collection?.theme?.emoji || '📚'} {listing.userItem.item.collection?.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-2">
                      Listado em {formatDate(listing.createdAt)}
                    </div>
                    
                    {listing.seller.id !== session?.user?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePurchaseClick(listing)
                        }}
                        disabled={purchasing === listing.id}
                        className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                      >
                        {purchasing === listing.id ? 'Comprando...' : 'Comprar'}
                      </button>
                    )}
                    
                    {listing.seller.id === session?.user?.id && (
                      <div className="text-yellow-400 text-sm font-semibold">
                        Seu item
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-6 animate-bounce">🛒</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Nenhum item encontrado
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Não há itens disponíveis no marketplace com os filtros selecionados.
              </p>
              <Link
                href="/marketplace/my-listings"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="mr-2">💼</span>
                Ver Minhas Vendas
              </Link>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mb-8">
              <button
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                disabled={pagination.page === 1}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              >
                ← Anterior
              </button>
              
              <span className="text-white font-bold px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                Página {pagination.page} de {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                disabled={pagination.page === pagination.pages}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              >
                Próxima →
              </button>
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

      {/* Floating My Listings Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <Link
          href="/marketplace/my-listings"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-3xl border border-white/20"
        >
          <span className="mr-2">💼</span>
          Minhas Vendas
        </Link>
      </div>

      {/* Item Details Modal */}
      {selectedListing && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setSelectedListing(null)}
        >
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-80 h-80 mx-auto bg-gray-700 rounded-xl mb-6 flex items-center justify-center overflow-hidden shadow-2xl">
                {selectedListing.userItem.item.imageUrl && selectedListing.userItem.item.imageUrl !== '/items/default.jpg' ? (
                  <img 
                    src={selectedListing.userItem.item.imageUrl} 
                    alt={selectedListing.userItem.item.name}
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
              
              <h3 className={`text-3xl font-bold mb-3 ${getRarityColor(selectedListing.userItem.item.rarity).split(' ')[0]}`}>
                {selectedListing.userItem.item.name}
                {selectedListing.userItem.limitedEdition && (
                  <span className="text-purple-400 ml-2">
                    🏆 #{selectedListing.userItem.limitedEdition.serialNumber}
                  </span>
                )}
              </h3>
              
              <p className="text-gray-300 mb-4 text-lg">
                {selectedListing.userItem.item.description}
              </p>
              
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${getRarityColor(selectedListing.userItem.item.rarity)}`}>
                {getRarityName(selectedListing.userItem.item.rarity)}
              </div>
              
              <div className="text-green-400 font-bold text-3xl mb-6">
                {selectedListing.price} créditos
              </div>

              {selectedListing.description && (
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="text-gray-300 text-sm mb-2">Descrição do vendedor:</div>
                  <div className="text-white">{selectedListing.description}</div>
                </div>
              )}
              
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <div className="text-gray-300 text-sm mb-2">Vendedor:</div>
                <div className="text-white font-semibold">
                  {selectedListing.seller.name || selectedListing.seller.email}
                </div>
              </div>

              {selectedListing.userItem.limitedEdition && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                  <div className="text-purple-400 font-semibold text-sm mb-2 flex items-center">
                    <span className="mr-2">🏆</span>
                    Edição Limitada
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Número da Edição:</span>
                      <span className="text-purple-400 font-bold">
                        #{selectedListing.userItem.limitedEdition.serialNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total de Edições:</span>
                      <span className="text-purple-400 font-bold">
                        {selectedListing.userItem.limitedEdition.item.maxEditions || '∞'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  Fechar
                </button>
                
                {selectedListing.seller.id !== session?.user?.id && (
                  <button
                    onClick={() => handlePurchaseClick(selectedListing)}
                    disabled={purchasing === selectedListing.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    {purchasing === selectedListing.id ? 'Comprando...' : 'Comprar Agora'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {confirmPurchase && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setConfirmPurchase(null)}
        >
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Confirmar Compra
            </h3>
            
            {/* Item Preview */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {confirmPurchase.userItem.item.imageUrl && confirmPurchase.userItem.item.imageUrl !== '/items/default.jpg' ? (
                  <img 
                    src={confirmPurchase.userItem.item.imageUrl} 
                    alt={confirmPurchase.userItem.item.name}
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
              
              <h4 className={`text-lg font-bold ${getRarityColor(confirmPurchase.userItem.item.rarity).split(' ')[0]}`}>
                {confirmPurchase.userItem.item.name}
                {confirmPurchase.userItem.limitedEdition && (
                  <span className="text-purple-400 ml-1">
                    🏆 #{confirmPurchase.userItem.limitedEdition.serialNumber}
                  </span>
                )}
              </h4>
              
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getRarityColor(confirmPurchase.userItem.item.rarity)}`}>
                {getRarityName(confirmPurchase.userItem.item.rarity)}
              </div>
            </div>

            {/* Purchase Details */}
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Vendedor:</span>
                  <span className="text-white font-semibold">
                    {confirmPurchase.seller.name || confirmPurchase.seller.email}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Preço:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {confirmPurchase.price} créditos
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Coleção:</span>
                  <span className="text-blue-400">
                    {confirmPurchase.userItem.item.collection?.theme?.emoji || '📚'} {confirmPurchase.userItem.item.collection?.name}
                  </span>
                </div>

                <hr className="border-white/20 my-2" />
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Seu saldo atual:</span>
                  <span className="text-blue-400 font-semibold">
                    {userCredits} créditos
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Saldo após compra:</span>
                  <span className={`font-semibold ${userCredits >= confirmPurchase.price ? 'text-green-400' : 'text-red-400'}`}>
                    {userCredits - confirmPurchase.price} créditos
                  </span>
                </div>
              </div>
            </div>

            {confirmPurchase.description && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                <div className="text-blue-400 text-sm font-semibold mb-1">Descrição do vendedor:</div>
                <div className="text-white text-sm">{confirmPurchase.description}</div>
              </div>
            )}

            {/* Warning */}
            {userCredits >= confirmPurchase.price ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
                <div className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Atenção:</div>
                <div className="text-yellow-300 text-sm">
                  Esta compra não pode ser desfeita. Verifique os detalhes antes de confirmar.
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                <div className="text-red-400 text-sm font-semibold mb-1">❌ Saldo Insuficiente:</div>
                <div className="text-red-300 text-sm">
                  Você não possui créditos suficientes para esta compra. Adquira mais créditos para continuar.
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmPurchase(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleConfirmPurchase}
                disabled={purchasing === confirmPurchase.id || userCredits < confirmPurchase.price}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                {purchasing === confirmPurchase.id ? 'Comprando...' : 
                 userCredits < confirmPurchase.price ? 'Saldo Insuficiente' : 'Confirmar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}