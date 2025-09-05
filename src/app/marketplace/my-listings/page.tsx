'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getRarityName } from '@/lib/rarity-system'
import { useUserRankings } from '@/hooks/useUserRankings'
import { useAdmin } from '@/hooks/useAdmin'
import { HeaderStatsSkeleton, RankingsSkeleton } from '@/components/SkeletonLoader'

interface UserMarketplaceListing {
  id: string
  price: number
  description?: string
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED'
  createdAt: string
  updatedAt: string
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
  transactions: Array<{
    id: string
    buyer: {
      id: string
      name: string
      email: string
    }
    amount: number
    createdAt: string
  }>
}

interface MarketplaceStats {
  statusBreakdown: Array<{
    status: string
    _count: {
      status: number
    }
  }>
  totalEarnings: number
  totalSales: number
}

interface MarketplacePurchase {
  id: string
  amount: number
  marketplaceFee: number
  status: string
  createdAt: string
  completedAt?: string
  listing: {
    id: string
    price: number
    description?: string
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
  }
  seller: {
    id: string
    name: string
    email: string
  }
}

export default function MyMarketplaceListings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales')
  const [listings, setListings] = useState<UserMarketplaceListing[]>([])
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([])
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [editingListing, setEditingListing] = useState<UserMarketplaceListing | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [editDescription, setEditDescription] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const { bestRanking, loading: rankingLoading } = useUserRankings()
  const { isAdmin, isSuperAdmin } = useAdmin()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchUserProfile()
      fetchUserStats()
      if (activeTab === 'sales') {
        fetchListings(true) // Só mostrar loading no carregamento inicial
      } else {
        fetchPurchases(true) // Só mostrar loading no carregamento inicial
      }
    }
  }, [status, router])

  // Close user menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-user-menu]') && !target.closest('[data-menu-item]')) {
          setShowUserMenu(false)
        }
      }
    }

    const handleScroll = () => {
      if (showUserMenu) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [showUserMenu])

  // useEffect separado para mudanças de filtros/tabs (sem loading)
  useEffect(() => {
    if (status === 'authenticated') {
      if (activeTab === 'sales') {
        fetchListings(false) // Não mostrar loading ao filtrar
      } else {
        fetchPurchases(false) // Não mostrar loading ao filtrar
      }
    }
  }, [selectedStatus, activeTab])

  const fetchListings = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      
      const params = new URLSearchParams()
      if (selectedStatus) {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/user/marketplace/listings?${params}`, {
        headers: { 'Cache-Control': 'max-age=120' },
        cache: 'default'
      })
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching marketplace listings:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const fetchPurchases = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      
      const params = new URLSearchParams({
        type: 'purchases'
      })

      const response = await fetch(`/api/marketplace/transactions?${params}`, {
        headers: { 'Cache-Control': 'max-age=180' },
        cache: 'default'
      })
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching marketplace purchases:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Tem certeza de que deseja cancelar esta listagem?')) return

    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Listagem cancelada com sucesso!')
        fetchListings(false) // Não mostrar loading ao cancelar
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao cancelar listagem')
      }
    } catch (error) {
      console.error('Error cancelling listing:', error)
      alert('Erro ao cancelar listagem')
    }
  }

  const handleUpdateListing = async () => {
    if (!editingListing || !editPrice || parseFloat(editPrice) <= 0) return

    setSaving(true)
    try {
      const response = await fetch(`/api/marketplace/listings/${editingListing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: parseFloat(editPrice),
          description: editDescription
        })
      })

      if (response.ok) {
        alert('Listagem atualizada com sucesso!')
        setEditingListing(null)
        setEditPrice('')
        setEditDescription('')
        fetchListings(false) // Não mostrar loading ao atualizar
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atualizar listagem')
      }
    } catch (error) {
      console.error('Error updating listing:', error)
      alert('Erro ao atualizar listagem')
    } finally {
      setSaving(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const profileResponse = await fetch('/api/user/profile', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUserProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      const statsResponse = await fetch('/api/user/stats', {
        headers: { 'Cache-Control': 'max-age=180' }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  const startEditing = (listing: UserMarketplaceListing) => {
    setEditingListing(listing)
    setEditPrice(listing.price.toString())
    setEditDescription(listing.description || '')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-500/20'
      case 'SOLD': return 'text-blue-400 bg-blue-500/20'
      case 'CANCELLED': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
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

  // Handle redirect for unauthenticated users
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {status === 'loading' && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse z-50"></div>
      )}
      
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
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
                  💼 <span className="text-purple-300">Minhas Vendas</span>
                </div>
                <div className="text-gray-400 text-sm">Gerencie suas vendas e visualize compras</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {(profileLoading || statsLoading || rankingLoading) || (!userStats && !userProfile) ? (
                <HeaderStatsSkeleton />
              ) : (
                <>
                  {/* Level and XP - sempre visível e com tamanho normal */}
                  {userStats && (
                    <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 border border-purple-400/30 hover:border-purple-300/50 transition-colors duration-200">
                      <Link href="/achievements" className="flex items-center space-x-3 group">
                        <div className="text-center">
                          <div className="text-purple-300 font-bold text-xs sm:text-sm group-hover:text-purple-200 transition-colors">⭐ Nível {userStats.level || 1}</div>
                          <div className="text-xs text-gray-300 group-hover:text-purple-200 transition-colors">{userStats.totalXP || 0} XP</div>
                        </div>
                      </Link>
                    </div>
                  )}
                  
                  {/* Container para elementos empilhados no mobile */}
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4">

                    {/* User Ranking */}
                    {!rankingLoading && bestRanking.position > 0 && (
                      <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 backdrop-blur-sm rounded-xl px-2 py-1 sm:px-4 sm:py-2 border border-indigo-400/30 hover:border-indigo-300/50 transition-colors duration-200">
                        <Link href="/rankings" className="flex items-center space-x-1 sm:space-x-3 group">
                          <div className="text-center">
                            <div className="text-indigo-300 font-bold text-xs sm:text-sm flex items-center justify-center">
                              <span className="mr-1 text-xs sm:text-sm">📊</span>
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
                    <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-xl px-2 py-1 sm:px-4 sm:py-2 border border-yellow-400/30 hover:border-yellow-300/50 transition-colors duration-200">
                      <Link href="/credits/purchase" className="flex items-center space-x-1 sm:space-x-2 group">
                        <span className="text-yellow-300 text-sm sm:text-lg group-hover:scale-110 transition-transform duration-200">💰</span>
                        <div>
                          <div className="text-yellow-300 font-bold text-xs sm:text-sm group-hover:text-yellow-200 transition-colors">{userProfile?.credits || 0}</div>
                          <div className="text-xs text-yellow-200 group-hover:text-yellow-100 transition-colors">créditos</div>
                        </div>
                      </Link>
                    </div>
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
                
                {/* User Menu */}
                <div data-user-menu>
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setMenuPosition({
                        top: rect.bottom + 8 + window.scrollY,
                        right: window.innerWidth - rect.right
                      })
                      setShowUserMenu(!showUserMenu)
                    }}
                    className="flex items-center space-x-2 p-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                    title="Menu do usuário"
                  >
                    {/* User Avatar */}
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                      {userProfile?.profileImage ? (
                        <Image
                          src={userProfile.profileImage}
                          alt={session?.user?.name || 'User'}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        session?.user?.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <span className="text-sm">☰</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="mr-3">💼</span>
              Minhas Vendas
            </h1>
            <p className="text-gray-300 text-lg">
              Gerencie suas vendas e visualize suas compras no marketplace
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-2 border border-white/20 shadow-xl">
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === 'sales'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  📦 Minhas Vendas
                </button>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === 'purchases'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🛒 Minhas Compras
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Only for Sales */}
          {activeTab === 'sales' && stats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-bounce">💰</div>
                <div className="text-3xl font-bold text-green-400 mb-1">{stats.totalEarnings}</div>
                <div className="text-sm text-gray-300">Total Ganho</div>
              </div>
              
              <div className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">🏆</div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalSales}</div>
                <div className="text-sm text-gray-300">Vendas Realizadas</div>
              </div>
              
              <div className="group bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">⚡</div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {stats.statusBreakdown.find(s => s.status === 'ACTIVE')?._count.status || 0}
                </div>
                <div className="text-sm text-gray-300">Anúncios Ativos</div>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-spin">📦</div>
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {listings.length}
                </div>
                <div className="text-sm text-gray-300">Total de Listagens</div>
              </div>
            </div>
          )}

          {/* Status Filter - Only for Sales */}
          {activeTab === 'sales' && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center">
                <span className="mr-2">🔍</span>
                Filtrar por Status
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setSelectedStatus('')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedStatus === '' 
                      ? 'bg-gradient-to-r from-white/30 to-gray-300/30 text-white border-white/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  🌏 Todas
                </button>
                
                <button
                  onClick={() => setSelectedStatus('ACTIVE')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedStatus === 'ACTIVE' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  ⚡ Ativas
                </button>
                
                <button
                  onClick={() => setSelectedStatus('SOLD')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedStatus === 'SOLD' 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  🏆 Vendidas
                </button>
                
                <button
                  onClick={() => setSelectedStatus('CANCELLED')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedStatus === 'CANCELLED' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  ❌ Canceladas
                </button>
              </div>
            </div>
          )}

          {/* Sales Tab Content */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              {loading && listings.length === 0 ? (
                // Listings skeleton loading
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 border-gray-500/30 animate-pulse">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <div className="w-20 h-20 bg-gray-600 rounded-lg"></div>
                          <div>
                            <div className="w-32 h-6 bg-gray-600 rounded mb-2"></div>
                            <div className="w-20 h-4 bg-gray-600 rounded"></div>
                          </div>
                        </div>
                        <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <div className="w-12 h-4 bg-gray-600 rounded mb-1"></div>
                            <div className="w-20 h-6 bg-gray-600 rounded"></div>
                          </div>
                          <div>
                            <div className="w-12 h-4 bg-gray-600 rounded mb-1"></div>
                            <div className="w-16 h-4 bg-gray-600 rounded"></div>
                          </div>
                          <div>
                            <div className="w-16 h-4 bg-gray-600 rounded mb-1"></div>
                            <div className="w-24 h-4 bg-gray-600 rounded"></div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-16 h-8 bg-gray-600 rounded"></div>
                          <div className="w-16 h-8 bg-gray-600 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length > 0 ? (
                listings.map((listing) => (
                <div
                  key={listing.id}
                  className={`group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 ${getRarityColor(listing.userItem.item.rarity)} hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-[1.02]`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Item Info */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
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
                          <span className="text-2xl">🏆</span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className={`text-lg font-bold ${getRarityColor(listing.userItem.item.rarity).split(' ')[0]}`}>
                          {listing.userItem.item.name}
                          {listing.userItem.limitedEdition && (
                            <span className="text-purple-400 ml-1">
                              🏆 #{listing.userItem.limitedEdition.serialNumber}
                            </span>
                          )}
                        </h3>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(listing.userItem.item.rarity)}`}>
                          {getRarityName(listing.userItem.item.rarity)}
                        </div>
                      </div>
                    </div>

                    {/* Listing Details */}
                    <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-300 text-sm">Preço</div>
                        <div className="text-green-400 font-bold text-lg">
                          {listing.price} créditos
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-300 text-sm">Status</div>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(listing.status)}`}>
                          {listing.status === 'ACTIVE' ? 'Ativo' : 
                           listing.status === 'SOLD' ? 'Vendido' : 'Cancelado'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-300 text-sm">Listado em</div>
                        <div className="text-white text-sm">
                          {formatDate(listing.createdAt)}
                        </div>
                      </div>

                      {listing.status === 'SOLD' && listing.transactions.length > 0 && (
                        <div>
                          <div className="text-gray-300 text-sm">Comprador</div>
                          <div className="text-blue-400 text-sm">
                            {listing.transactions[0].buyer.name || listing.transactions[0].buyer.email}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {listing.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => startEditing(listing)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleCancelListing(listing.id)}
                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {listing.description && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                      <div className="text-gray-300 text-sm mb-1">Descrição:</div>
                      <div className="text-white">{listing.description}</div>
                    </div>
                  )}
                </div>
              ))
              ) : (
                // Empty state for sales when not loading
                !loading && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Nenhuma listagem encontrada
                    </h2>
                    <p className="text-gray-300 mb-8">
                      Você ainda não tem itens listados no marketplace.
                    </p>
                    <Link
                      href="/inventory"
                      className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-200"
                    >
                      Ir para Inventário
                    </Link>
                  </div>
                )
              )}
            </div>
          )}

          {/* Purchases Tab Content */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {loading && purchases.length === 0 ? (
                // Purchases skeleton loading
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 border-gray-500/30 animate-pulse">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <div className="w-20 h-20 bg-gray-600 rounded-lg"></div>
                          <div>
                            <div className="w-32 h-6 bg-gray-600 rounded mb-2"></div>
                            <div className="w-20 h-4 bg-gray-600 rounded"></div>
                          </div>
                        </div>
                        <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <div className="w-16 h-4 bg-gray-600 rounded mb-1"></div>
                            <div className="w-20 h-6 bg-gray-600 rounded"></div>
                          </div>
                          <div>
                            <div className="w-16 h-4 bg-gray-600 rounded mb-1"></div>
                            <div className="w-24 h-4 bg-gray-600 rounded"></div>
                          </div>
                          <div>
                            <div className="w-20 h-4 bg-gray-600 rounded mb-1"></div>
                            <div className="w-28 h-4 bg-gray-600 rounded"></div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-20 h-6 bg-gray-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : purchases.length > 0 ? (
                purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className={`group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 ${getRarityColor(purchase.listing.userItem.item.rarity)} hover:shadow-2xl transition-all duration-300 hover:transform hover:scale-[1.02]`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Item Info */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {purchase.listing.userItem.item.imageUrl && purchase.listing.userItem.item.imageUrl !== '/items/default.jpg' ? (
                          <img 
                            src={purchase.listing.userItem.item.imageUrl} 
                            alt={purchase.listing.userItem.item.name}
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
                      
                      <div>
                        <h3 className={`text-lg font-bold ${getRarityColor(purchase.listing.userItem.item.rarity).split(' ')[0]}`}>
                          {purchase.listing.userItem.item.name}
                          {purchase.listing.userItem.limitedEdition && (
                            <span className="text-purple-400 ml-1">
                              🏆 #{purchase.listing.userItem.limitedEdition.serialNumber}
                            </span>
                          )}
                        </h3>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(purchase.listing.userItem.item.rarity)}`}>
                          {getRarityName(purchase.listing.userItem.item.rarity)}
                        </div>
                      </div>
                    </div>

                    {/* Purchase Details */}
                    <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <div className="text-gray-300 text-sm">Preço Pago</div>
                        <div className="text-red-400 font-bold text-lg">
                          -{purchase.amount} créditos
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-300 text-sm">Vendedor</div>
                        <div className="text-blue-400 text-sm">
                          {purchase.seller.name || purchase.seller.email}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-300 text-sm">Comprado em</div>
                        <div className="text-white text-sm">
                          {formatDate(purchase.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                        Adquirido ✅
                      </span>
                    </div>
                  </div>

                  {purchase.listing.description && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                      <div className="text-gray-300 text-sm mb-1">Descrição do item:</div>
                      <div className="text-white">{purchase.listing.description}</div>
                    </div>
                  )}
                </div>
              ))
              ) : (
                // Empty state for purchases when not loading
                !loading && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Nenhuma compra encontrada
                    </h2>
                    <p className="text-gray-300 mb-8">
                      Você ainda não comprou nenhum item no marketplace.
                    </p>
                    <Link
                      href="/marketplace"
                      className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-200"
                    >
                      Explorar Marketplace
                    </Link>
                  </div>
                )
              )}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/marketplace"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Marketplace
            </Link>
          </div>
        </div>
      </main>

      {/* User Menu Dropdown */}
      {showUserMenu && (
        <div 
          className="absolute w-64 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl z-[99999] overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200"
          style={{ 
            top: menuPosition.top, 
            right: menuPosition.right 
          }}
          data-user-dropdown
        >
          {/* Menu Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                {userProfile?.profileImage ? (
                  <Image
                    src={userProfile.profileImage}
                    alt={session?.user?.name || 'User'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  session?.user?.name?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div>
                <div className="text-white font-medium">{session?.user?.name || 'Usuário'}</div>
                <div className="text-gray-400 text-sm">{userProfile?.credits || 0} créditos</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* Profile */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/profile/settings'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">👤</span>
                <span>Meu Perfil</span>
              </div>
            </button>

            {/* Buy Credits */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/credits/purchase'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">💰</span>
                <span>Comprar Créditos</span>
              </div>
            </button>

            {/* Pack Store */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/packs'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">📦</span>
                <span>Loja de Pacotes</span>
              </div>
            </button>

            {/* Inventory */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/inventory'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🎒</span>
                <span>Inventário</span>
              </div>
            </button>

            {/* Collections */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/collections'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">📚</span>
                <span>Coleções</span>
              </div>
            </button>

            {/* Marketplace */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/marketplace'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🛒</span>
                <span>Marketplace</span>
              </div>
            </button>

            {/* Rankings */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/rankings'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">📊</span>
                <span>Rankings</span>
              </div>
            </button>

            {/* Achievements */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/achievements'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🏆</span>
                <span>Conquistas</span>
              </div>
            </button>

            {/* Dashboard */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/dashboard'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🏠</span>
                <span>Dashboard</span>
              </div>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-white/10"></div>

            {/* Logout */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                setShowUserMenu(false)
                setShowLogoutModal(true)
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-red-600/20 rounded-lg transition-colors duration-200 text-red-400 hover:text-red-300 text-left"
            >
              <span className="text-lg w-5 flex justify-center">🚪</span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setEditingListing(null)}
        >
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Editar Listagem
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preço (créditos)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descreva seu item..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingListing(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleUpdateListing}
                disabled={saving || !editPrice || parseFloat(editPrice) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

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