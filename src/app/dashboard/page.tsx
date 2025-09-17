'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserRankings } from '@/hooks/useUserRankings'
import { useAdmin } from '@/hooks/useAdmin'
import FreePackModal from '@/components/FreePackModal'
import DailyRewardPackModal from '@/components/DailyRewardPackModal'
import StreakIndicator from '@/components/StreakIndicator'
import { ProfileSkeleton, StatsSkeleton, ActivitiesSkeleton, HeaderStatsSkeleton } from '@/components/SkeletonLoader'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showFreePackModal, setShowFreePackModal] = useState(false)
  const [hasUnclaimedFreePack, setHasUnclaimedFreePack] = useState(false)
  const [showDailyRewardPackModal, setShowDailyRewardPackModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const { bestRanking, loading: rankingLoading } = useUserRankings()
  const { isAdmin, isSuperAdmin, role } = useAdmin()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session?.user) {
      // Carregamento progressivo - começar imediatamente sem aguardar todos os dados
      fetchUserDataProgressive()
    } else if (status === 'loading') {
      // Keep skeleton states as true during session loading
    } else {
      // Reset loading states if not authenticated
      setProfileLoading(false)
      setStatsLoading(false)
      setActivitiesLoading(false)
    }
  }, [status, router, session])

  // Close user menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement
        // Don't close if clicking on menu items - let them handle navigation first
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

  // Carregamento otimizado com priorização
  const fetchUserDataProgressive = async () => {
    // 1. Buscar dados críticos em paralelo (header stats)
    const criticalDataPromises = [
      fetchUserProfile(),
      fetchUserStats()
    ]

    // 2. Buscar dados menos críticos sem aguardar os críticos
    const nonCriticalPromises = [
      fetchRecentActivities(),
      checkFreePack(),
      checkDailyRewardPacks()
    ]

    // 3. Aguardar dados críticos para remover skeleton do header mais rápido
    try {
      await Promise.allSettled(criticalDataPromises)
    } catch (error) {
      console.error('Error loading critical data:', error)
    }

    // 4. Dados não críticos podem continuar carregando em background
    Promise.allSettled(nonCriticalPromises).catch(error => {
      console.error('Error loading non-critical data:', error)
    })
  }

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await fetch('/api/user/profile', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        const profileData = await response.json()
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
      const response = await fetch('/api/user/stats', {
        cache: 'force-cache',
        next: { revalidate: 180 } // Cache 3min with ISR - shorter because stats change more frequently
      })

      if (response.ok) {
        const statsData = await response.json()
        setUserStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const checkFreePack = async () => {
    try {
      const response = await fetch('/api/free-pack/check')
      if (response.ok) {
        const freePackData = await response.json()
        if (!freePackData.hasReceivedFreePack || freePackData.unclaimedFreePack) {
          setHasUnclaimedFreePack(true)
          setShowFreePackModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking free pack:', error)
    }
  }

  const checkDailyRewardPacks = async () => {
    try {
      const response = await fetch('/api/daily-rewards/check-packs')
      if (response.ok) {
        const data = await response.json()
        if (data.unclaimedDailyPacks && data.unclaimedDailyPacks.length > 0) {
          setShowDailyRewardPackModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking daily reward packs:', error)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true)
      // Add cache for improved performance
      const response = await fetch('/api/user/recent-activity?limit=10', {
        cache: 'force-cache',
        next: { revalidate: 60 } // Cache 1min - activities change frequently
      })

      if (response.ok) {
        const data = await response.json()
        setRecentActivities(data.activities || [])
      } else {
        console.error('Error fetching activities:', response.status)
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PACK_OPENED': return '📦'
      case 'ITEM_OBTAINED': return '🏆'
      case 'MARKETPLACE_SALE': return '💰'
      case 'MARKETPLACE_PURCHASE': return '🛒'
      case 'ACHIEVEMENT_UNLOCKED': return '🎖️'
      case 'COLLECTION_COMPLETED': return '✅'
      case 'CREDITS_PURCHASED': return '💳'
      case 'DAILY_REWARD_CLAIMED': return '🔥'
      default: return '📌'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'text-gray-400'
      case 'INCOMUM': return 'text-green-400'
      case 'RARO': return 'text-blue-400'
      case 'EPICO': return 'text-purple-400'
      case 'LENDARIO': return 'text-yellow-400'
      default: return 'text-white'
    }
  }

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes <= 1 ? 'Agora há pouco' : `${diffInMinutes}m atrás`
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d atrás`
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  // Don't block the entire page on session loading
  // if (status === 'loading') {
  //   return loading screen - removed to prevent blocking
  // }

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
              <Link href="/" className="flex items-center">
                <Image
                  src="/Dropa!.png"
                  alt="Dropa!"
                  width={120}
                  height={60}
                  className="drop-shadow-lg filter drop-shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform duration-300"
                  priority
                />
              </Link>

              {/* Welcome Text */}
              <div className="hidden md:block">
                <div className="text-white font-medium">
                  Bem-vindo, <span className="text-purple-300">{session?.user?.name || session?.user?.email}</span>
                </div>
                <div className="text-gray-400 text-sm">Sua jornada épica continua...</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {(statsLoading || profileLoading || rankingLoading) || (!userStats && !userProfile) ? (
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

                    {/* User Ranking - Show immediately if available or loading with placeholder */}
                    {(bestRanking.position > 0 || (rankingLoading && userStats && userStats.totalXP > 0)) && (
                      <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 backdrop-blur-sm rounded-xl px-2 py-1 sm:px-4 sm:py-2 border border-indigo-400/30 hover:border-indigo-300/50 transition-colors duration-200">
                        <Link href="/rankings" className="flex items-center space-x-1 sm:space-x-3 group">
                          <div className="text-center">
                            <div className="text-indigo-300 font-bold text-xs sm:text-sm flex items-center justify-center">
                              <span className="mr-1 text-xs sm:text-sm">📊</span>
                            {bestRanking.position > 0 ? (
                              <>
                                <span>#{bestRanking.position}</span>
                                <span className="ml-1 text-xs opacity-75">({Math.round(bestRanking.percentage)}%)</span>
                              </>
                            ) : (
                              <span className="animate-pulse">Carregando...</span>
                            )}
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
                {/* Free Pack Button */}
                {hasUnclaimedFreePack && (
                  <button
                    onClick={() => setShowFreePackModal(true)}
                    className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 animate-pulse"
                    title="Pacote Grátis Disponível!"
                  >
                    🎁
                  </button>
                )}

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

      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-20 text-purple-300/20 text-4xl animate-pulse">⚡</div>
          <div className="absolute top-20 right-40 text-blue-300/20 text-3xl animate-bounce delay-300">💎</div>
          <div className="absolute bottom-20 left-1/3 text-indigo-300/20 text-5xl animate-pulse delay-700">🌟</div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 mb-4">
              SUA AVENTURA CONTINUA!
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Bem-vindo de volta, <span className="text-purple-400 font-semibold">{session?.user?.name || 'Colecionador'}</span>!
              Sua coleção épica te aguarda. Que raridades você descobrirá hoje?
            </p>

            {/* Quick Stats */}
            <div className="mb-12 max-w-5xl mx-auto">
              {statsLoading || !userStats ? (
                <StatsSkeleton />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30">
                    <div className="text-2xl font-bold text-purple-300">{userStats?.totalPacksOpened || 0}</div>
                    <div className="text-sm text-gray-300">Pacotes Abertos</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
                    <div className="text-2xl font-bold text-blue-300">{userStats?.totalItemsCollected || 0}</div>
                    <div className="text-sm text-gray-300">Itens Coletados</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-xl p-4 border border-yellow-400/30">
                    <div className="text-2xl font-bold text-yellow-300">{userStats?.legendaryItemsFound || 0}</div>
                    <div className="text-sm text-gray-300">Itens Lendários</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
                    <div className="text-2xl font-bold text-green-300">{userProfile?.credits || 0}</div>
                    <div className="text-sm text-gray-300">Créditos</div>
                  </div>

                  {/* Daily Streak Card */}
                  {session?.user?.id && (
                    <div className="bg-gradient-to-br from-orange-600/30 to-red-600/30 backdrop-blur-sm rounded-xl p-4 border border-orange-400/30 relative overflow-hidden">
                      <StreakIndicator onRewardClaimed={fetchUserDataProgressive} compact />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">

          {/* Pack Store - Primary Action */}
          <div className="group relative bg-gradient-to-br from-purple-800/40 to-blue-800/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-6 group-hover:animate-bounce">📦</div>
              <h2 className="text-2xl font-bold text-white mb-3">Loja de Pacotes</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Descubra tesouros místicos! Escolha entre pacotes Bronze, Prata e Ouro. Cada um com chances únicas de raridades épicas.
              </p>
              <Link
                href="/packs"
                className="inline-block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                ⚡ Abrir Pacotes
              </Link>
            </div>
          </div>

          {/* Buy Credits */}
          <div className="group relative bg-gradient-to-br from-green-800/40 to-emerald-800/40 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-6 group-hover:animate-pulse">💰</div>
              <h2 className="text-2xl font-bold text-white mb-3">Comprar Créditos</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Adquira créditos para alimentar sua jornada de colecionador. Pagamento seguro via PIX, cartão.
              </p>
              <Link
                href="/credits/purchase"
                className="inline-block w-full text-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                💳 Comprar Créditos
              </Link>
            </div>
          </div>

          {/* Inventory */}
          <div className="group relative bg-gradient-to-br from-indigo-800/40 to-purple-800/40 backdrop-blur-lg rounded-2xl p-8 border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-6 group-hover:animate-pulse">🎒</div>
              <h2 className="text-2xl font-bold text-white mb-3">Meu Inventário</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Explore sua coleção épica! Veja todos os itens que conquistou e organize seus tesouros por raridade.
              </p>
              <Link
                href="/inventory"
                className="inline-block w-full text-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                👑 Ver Inventário
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">


          {/* Collections */}
          <div className="group bg-gradient-to-br from-orange-800/40 to-red-800/40 backdrop-blur-lg rounded-xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-4xl mb-4 group-hover:animate-bounce">📚</div>
            <h3 className="text-lg font-bold text-white mb-2">Minhas Coleções</h3>
            <p className="text-gray-300 text-sm mb-4">Explore coleções temáticas e acompanhe seu progresso.</p>
            <Link
              href="/collections"
              className="inline-block w-full text-center px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Ver Coleções
            </Link>
          </div>

          {/* Marketplace */}
          <div className="group bg-gradient-to-br from-pink-800/40 to-rose-800/40 backdrop-blur-lg rounded-xl p-6 border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-4xl mb-4 group-hover:animate-bounce">🛒</div>
            <h3 className="text-lg font-bold text-white mb-2">Marketplace</h3>
            <p className="text-gray-300 text-sm mb-4">Compre e venda itens com outros jogadores.</p>
            <Link
              href="/marketplace"
              className="inline-block w-full text-center px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Ir ao Marketplace
            </Link>
          </div>

          {/* Achievements */}
          <div className="group bg-gradient-to-br from-yellow-800/40 to-orange-800/40 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-4xl mb-4 group-hover:animate-pulse group-hover:scale-110 transition-transform duration-300">🏆</div>
            <h3 className="text-lg font-bold text-white mb-2">Conquistas</h3>
            <p className="text-gray-300 text-sm mb-4">Desbloqueie conquistas e ganhe XP completando desafios.</p>
            <Link
              href="/achievements"
              className="inline-block w-full text-center px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Ver Conquistas
            </Link>
          </div>

          {/* Rankings */}
          <div className="group bg-gradient-to-br from-cyan-800/40 to-blue-800/40 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-4xl mb-4 group-hover:animate-bounce">📊</div>
            <h3 className="text-lg font-bold text-white mb-2">Rankings</h3>
            <p className="text-gray-300 text-sm mb-4">Veja sua posição nos rankings e compita com outros jogadores.</p>
            <Link
              href="/rankings"
              className="inline-block w-full text-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Ver Rankings
            </Link>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-gradient-to-br from-gray-800/40 to-slate-800/40 backdrop-blur-lg rounded-2xl p-8 border border-gray-500/30">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">⚡</span>
              Atividade Recente
            </h2>
          </div>

          {activitiesLoading && recentActivities.length === 0 ? (
            <ActivitiesSkeleton />
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div>
                      <div className="text-white font-medium">
                        {activity.description}
                      </div>
                      {activity.itemName && (
                        <div className={`text-sm ${getRarityColor(activity.rarity)}`}>
                          {activity.itemName}
                        </div>
                      )}
                      {activity.xpGained && (
                        <div className="text-xs text-green-400">
                          +{activity.xpGained} XP
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatActivityTime(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🌟</div>
              <p className="text-gray-400 text-lg">Sua jornada está começando!</p>
              <p className="text-gray-500 text-sm">Abra seu primeiro pacote para ver atividades aqui.</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Position User Menu */}
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

      {/* Free Pack Modal */}
      <FreePackModal
        isOpen={showFreePackModal}
        onClose={() => {
          setShowFreePackModal(false)
          setHasUnclaimedFreePack(false)
          // Refresh user profile after claiming free pack
          fetchUserProfile()
        }}
        onItemReceived={() => {
          // Refresh data immediately when item is received
          fetchUserProfile()
          fetchRecentActivities()
        }}
      />

      {/* Daily Reward Pack Modal */}
      <DailyRewardPackModal
        isOpen={showDailyRewardPackModal}
        onClose={() => {
          setShowDailyRewardPackModal(false)
        }}
        onItemReceived={() => {
          // Refresh data after claiming daily reward pack
          fetchUserProfile()
          fetchRecentActivities()
        }}
      />
    </div>
  )
}
