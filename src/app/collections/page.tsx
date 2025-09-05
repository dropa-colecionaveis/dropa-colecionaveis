'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserRankings } from '@/hooks/useUserRankings'
import { useAdmin } from '@/hooks/useAdmin'
import { 
  CollectionStatsSkeleton, 
  CollectionFilterSkeleton, 
  CollectionsGridSkeleton,
  HeaderStatsSkeleton
} from '@/components/SkeletonLoader'

interface CollectionProgress {
  itemsOwned: number
  totalItems: number
  progressPercentage: number
  isCompleted: boolean
}

interface Collection {
  id: string
  name: string
  description: string | null
  theme: string | null
  imageUrl: string | null
  maxItems: number
  isLimited: boolean
  createdAt: string
  progress: CollectionProgress
}

export default function Collections() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const { bestRanking, loading: rankingLoading } = useUserRankings()
  const { isAdmin, isSuperAdmin } = useAdmin()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      setLoading(false) // Auth is complete, start showing skeleton
      fetchCollections()
      fetchUserProfile()
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

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/user/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setCollectionsLoading(false)
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

  const getThemeColor = (theme: string | null | undefined) => {
    if (!theme) return 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
    
    switch (theme.toLowerCase()) {
      case 'medieval': return 'from-amber-500/20 to-orange-500/20 border-amber-500/30'
      case 'fantasy': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
      case 'classic': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      case 'sci-fi': return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
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

  const getFilteredCollections = () => {
    switch (selectedFilter) {
      case 'COMPLETED':
        return collections.filter(c => c.progress.isCompleted)
      case 'IN_PROGRESS':
        return collections.filter(c => c.progress.itemsOwned > 0 && !c.progress.isCompleted)
      case 'NOT_STARTED':
        return collections.filter(c => c.progress.itemsOwned === 0)
      case 'LIMITED':
        return collections.filter(c => c.isLimited)
      default:
        return collections
    }
  }

  const getCompletionStats = () => {
    const completed = collections.filter(c => c.progress.isCompleted).length
    const inProgress = collections.filter(c => c.progress.itemsOwned > 0 && !c.progress.isCompleted).length
    const notStarted = collections.filter(c => c.progress.itemsOwned === 0).length
    
    return { completed, inProgress, notStarted }
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  // Don't block the entire page on session loading
  // if (status === 'loading' || loading) {
  //   return loading screen - removed to prevent blocking
  // }

  const stats = getCompletionStats()
  const filteredCollections = getFilteredCollections()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Session loading indicator */}
      {status === 'loading' && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse z-50"></div>
      )}
      
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
                  📚 <span className="text-purple-300">Minhas Coleções</span>
                </div>
                <div className="text-gray-400 text-sm">Explore e complete coleções temáticas únicas</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {profileLoading || (!userStats && !userProfile) ? (
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="mr-3">📚</span>
              Minhas Coleções
            </h1>
            <p className="text-gray-300 text-lg">
              Explore e complete coleções temáticas únicas
            </p>
          </div>

          {/* Stats Cards */}
          {collectionsLoading ? (
            <CollectionStatsSkeleton />
          ) : (
            <div className="grid md:grid-cols-4 gap-6 mb-8 animate-fadeIn">
              <div className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-bounce">✅</div>
                <div className="text-3xl font-bold text-green-400 mb-1">{stats.completed}</div>
                <div className="text-sm text-gray-300">Completas</div>
              </div>
              
              <div className="group bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">⚡</div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.inProgress}</div>
                <div className="text-sm text-gray-300">Em Progresso</div>
              </div>
              
              <div className="group bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">🎯</div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.notStarted}</div>
                <div className="text-sm text-gray-300">Não Iniciadas</div>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-spin">⭐</div>
                <div className="text-3xl font-bold text-purple-400 mb-1">{collections.filter(c => c.isLimited).length}</div>
                <div className="text-sm text-gray-300">Limitadas</div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          {collectionsLoading ? (
            <CollectionFilterSkeleton />
          ) : (
            <div className="mb-8 animate-fadeIn">
              <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
                <span className="mr-2">🔍</span>
                Filtrar Coleções
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedFilter === 'ALL' 
                      ? 'bg-gradient-to-r from-white/30 to-gray-300/30 text-white border-white/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  🌟 Todas ({collections.length})
                </button>
                
                <button
                  onClick={() => setSelectedFilter('COMPLETED')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedFilter === 'COMPLETED' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  ✅ Completas ({stats.completed})
                </button>
                
                <button
                  onClick={() => setSelectedFilter('IN_PROGRESS')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedFilter === 'IN_PROGRESS' 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  ⚡ Em Progresso ({stats.inProgress})
                </button>
                
                <button
                  onClick={() => setSelectedFilter('NOT_STARTED')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedFilter === 'NOT_STARTED' 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  🎯 Não Iniciadas ({stats.notStarted})
                </button>
                
                <button
                  onClick={() => setSelectedFilter('LIMITED')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                    selectedFilter === 'LIMITED' 
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                  }`}
                >
                  ⭐ Limitadas ({collections.filter(c => c.isLimited).length})
                </button>
              </div>
            </div>
          )}

          {/* Collections Grid */}
          {collectionsLoading ? (
            <CollectionsGridSkeleton />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection, index) => (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <div 
                  className={`bg-gradient-to-br ${getThemeColor(collection.theme)} backdrop-blur-lg rounded-lg p-6 border hover:scale-105 transition-transform duration-200 cursor-pointer animate-staggered-fade`}
                  style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getThemeEmoji(collection.theme)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                        <div className="text-xs text-gray-300 capitalize">{collection.theme || 'Sem tema'}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      {collection.isLimited && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Limitada ⭐
                        </span>
                      )}
                      {collection.progress.isCompleted && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Completa ✅
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {collection.description || 'Uma coleção única de itens especiais'}
                  </p>
                  
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Progresso</span>
                      <span>{collection.progress.itemsOwned}/{collection.progress.totalItems}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          collection.progress.isCompleted 
                            ? 'bg-green-500' 
                            : collection.progress.progressPercentage > 0 
                              ? 'bg-blue-500' 
                              : 'bg-gray-600'
                        }`}
                        style={{ 
                          width: `${Math.min(collection.progress.progressPercentage, 100)}%`,
                          maxWidth: '100%'
                        }}
                      ></div>
                    </div>
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {Math.min(collection.progress.progressPercentage, 100)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                      Ver Coleção →
                    </span>
                  </div>
                </div>
              </Link>
              ))}
            </div>
          )}

          {!collectionsLoading && filteredCollections.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Nenhuma coleção encontrada
              </h2>
              <p className="text-gray-300 mb-8">
                Não há coleções que correspondam ao filtro selecionado.
              </p>
              <button
                onClick={() => setSelectedFilter('ALL')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
              >
                Ver Todas as Coleções
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

      {/* Logout Confirmation Modal */
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