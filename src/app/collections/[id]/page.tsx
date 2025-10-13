'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getRarityName } from '@/lib/rarity-system'
import { useUserRankings } from '@/hooks/useUserRankings'
import { useAdmin } from '@/hooks/useAdmin'
import { HeaderStatsSkeleton } from '@/components/SkeletonLoader'

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
      fetchCollection()
      fetchUserProfile()
      fetchUserStats()
    }
  }, [status, router, params.id])

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse z-50"></div>
        
        {/* Header Skeleton */}
        <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo Section */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="w-[120px] h-[60px] bg-gray-700/50 rounded animate-pulse"></div>
                <div className="hidden md:block">
                  <div className="w-32 h-5 bg-gray-700/50 rounded animate-pulse mb-2"></div>
                  <div className="w-48 h-4 bg-gray-700/50 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Header Stats Skeleton */}
              <HeaderStatsSkeleton />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Collection Header Skeleton */}
            <div className="bg-gradient-to-br from-gray-500/20 to-slate-500/20 backdrop-blur-lg rounded-lg p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-gray-700/50 rounded animate-pulse"></div>
                  <div>
                    <div className="w-48 h-8 bg-gray-700/50 rounded animate-pulse mb-2"></div>
                    <div className="w-32 h-5 bg-gray-700/50 rounded animate-pulse mb-2"></div>
                    <div className="w-64 h-4 bg-gray-700/50 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-8 bg-gray-700/50 rounded animate-pulse mb-1"></div>
                  <div className="w-20 h-4 bg-gray-700/50 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="mt-6">
                <div className="w-full h-4 bg-gray-700/50 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="backdrop-blur-lg rounded-lg p-4 border-2 bg-gray-500/20 border-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-6 bg-gray-700/50 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="w-16 h-4 bg-gray-700/50 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="w-10 h-4 bg-gray-700/50 rounded animate-pulse mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Buttons Skeleton */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="w-20 h-10 bg-gray-700/50 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Items Grid Skeleton */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="backdrop-blur-lg rounded-lg p-4 border-2 bg-gray-800/50 border-gray-600">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gray-700/50 rounded-lg mb-3 animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-700/50 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="w-16 h-6 bg-gray-700/50 rounded-full animate-pulse mx-auto mb-2"></div>
                    <div className="w-20 h-3 bg-gray-700/50 rounded animate-pulse mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
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
      {(loading || profileLoading || statsLoading) && (
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
                  📚 <span className="text-purple-300">Detalhes da Coleção</span>
                </div>
                <div className="text-gray-400 text-sm">Visualize seu progresso e itens</div>
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
          {/* Collection Header */}
          <div className={`bg-gradient-to-br ${getThemeColor(collection.theme)} backdrop-blur-lg rounded-lg p-8 mb-8`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                {collection.imageUrl ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                    <img
                      src={collection.imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl w-full h-full flex items-center justify-center">${getThemeEmoji(collection.theme)}</span>`
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-4xl">{getThemeEmoji(collection.theme)}</span>
                )}
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
                          className={`w-full h-full object-cover ${!item.isOwned ? 'blur-sm grayscale opacity-40' : ''}`}
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

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-red-900/90 to-pink-900/90 backdrop-blur-lg rounded-2xl p-6 max-w-sm w-full border border-red-500/30">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Confirmar Saída</h3>
              <p className="text-gray-300 mb-6">Tem certeza que deseja sair da sua conta?</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="relative w-40 h-40 mx-auto bg-gray-700 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                {selectedItem.isOwned ? (
                  // Item possuído - mostra imagem normal
                  <>
                    {selectedItem.imageUrl && selectedItem.imageUrl !== '/items/default.jpg' ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement!
                          parent.innerHTML = '<span class="text-6xl">🏆</span>'
                        }}
                      />
                    ) : (
                      <span className="text-6xl">🏆</span>
                    )}
                  </>
                ) : (
                  // Item não possuído - mostra imagem borrada com cadeado
                  <>
                    {selectedItem.imageUrl && selectedItem.imageUrl !== '/items/default.jpg' ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt="Item bloqueado"
                        className="w-full h-full object-cover blur-lg grayscale opacity-30"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                      <span className="text-white text-6xl">🔒</span>
                    </div>
                  </>
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