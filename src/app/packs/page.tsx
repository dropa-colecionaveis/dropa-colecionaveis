'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserRankings } from '@/hooks/useUserRankings'
import { useAdmin } from '@/hooks/useAdmin'
import { PacksSkeleton, HeaderStatsSkeleton } from '@/components/SkeletonLoader'

interface Pack {
  id: string
  name: string
  description: string
  price: number
  type: string
  probabilities: Array<{
    rarity: string
    percentage: number
  }>
}

interface UserProfile {
  credits: number
  profileImage?: string
}

export default function PackStore() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [packs, setPacks] = useState<Pack[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [packsLoading, setPacksLoading] = useState(false)
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
      return
    }
    
    if (status === 'authenticated' && session?.user) {
      // Progressive loading - start immediately without waiting for all data
      fetchDataProgressive()
    } else if (status === 'loading') {
      // Keep skeleton states as true during session loading
    } else {
      // Reset loading states if not authenticated
      setProfileLoading(false)
      setStatsLoading(false)
    }
  }, [status, router, session])

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

  // Optimized data fetching with priority
  const fetchDataProgressive = async () => {
    // 1. Fetch critical data in parallel for header skeleton
    const headerDataPromises = [
      fetchUserProfile(),
      fetchUserStats()
    ]
    
    // 2. Fetch page-specific data (packs) in parallel
    const pageDataPromise = fetchPacks()
    
    // 3. Wait for header data to remove skeleton faster
    try {
      await Promise.allSettled(headerDataPromises)
    } catch (error) {
      console.error('Error loading header data:', error)
    }
    
    // 4. Page data can continue loading
    try {
      await pageDataPromise
    } catch (error) {
      console.error('Error loading packs:', error)
    }
  }

  const fetchPacks = async () => {
    try {
      setPacksLoading(true)
      const response = await fetch('/api/packs', {
        cache: 'force-cache',
        next: { revalidate: 600 } // Cache 10min - packs change rarely
      })
      if (response.ok) {
        const data = await response.json()
        setPacks(data)
      }
    } catch (error) {
      console.error('Error fetching packs:', error)
    } finally {
      setPacksLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await fetch('/api/user/profile', {
        cache: 'force-cache',
        next: { revalidate: 300 } // Cache 5min with ISR
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
        next: { revalidate: 180 } // Cache 3min - stats change more frequently
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

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'Comum'
      case 'INCOMUM': return 'Incomum'
      case 'RARO': return 'Raro'
      case 'EPICO': return 'Épico'
      case 'LENDARIO': return 'Lendário'
      default: return rarity
    }
  }

  const canAffordPack = (price: number) => {
    return userProfile ? userProfile.credits >= price : false
  }

  const getPackTypeEmoji = (type: string) => {
    if (!type) {
      return '📦'
    }
    switch (type.toUpperCase()) {
      case 'BRONZE': return '🥉'
      case 'SILVER': return '🥈'
      case 'GOLD': return '🥇'
      case 'PLATINUM': return '💎'
      case 'DIAMOND': return '💠'
      default: 
        return '📦'
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
                  📦 <span className="text-purple-300">Loja de Pacotes</span>
                </div>
                <div className="text-gray-400 text-sm">Descubra tesouros épicos aguardando por você</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Show skeleton while loading or actual data when available */}
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Loja de Pacotes</h1>
            <p className="text-gray-300">
              Escolha seu pacote e descubra os tesouros que esperam por você!
            </p>
          </div>

          {/* Packs Grid with Skeleton */}
          {packsLoading || packs.length === 0 ? (
            <PacksSkeleton />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {packs.map((pack) => (
              <div key={pack.id} className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-xl hover:shadow-2xl">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4 group-hover:animate-bounce transition-all duration-300">
                    {getPackTypeEmoji(pack.type)}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{pack.name}</h2>
                  <p className="text-gray-300 mb-4 group-hover:text-gray-200 transition-colors">{pack.description}</p>
                  <div className="relative">
                    <div className="text-3xl font-bold text-green-400 mb-4 group-hover:text-green-300 transition-colors">
                      {pack.price} créditos
                    </div>
                    {canAffordPack(pack.price) && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        Pode abrir!
                      </div>
                    )}
                  </div>
                </div>

                {/* Probabilities */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="mr-2">🎯</span>
                    Probabilidades:
                  </h3>
                  <div className="space-y-2">
                    {pack.probabilities.map((prob) => (
                      <div key={prob.rarity} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                        <span className={`font-medium ${getRarityColor(prob.rarity)}`}>
                          {getRarityName(prob.rarity)}
                        </span>
                        <span className="text-white font-bold">{prob.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="text-center">
                  {canAffordPack(pack.price) ? (
                    <Link
                      href={`/packs/open/${pack.id}`}
                      className="inline-block w-full text-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      ⚡ Abrir Pacote
                    </Link>
                  ) : (
                    <div>
                      <button
                        disabled
                        className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 font-semibold rounded-xl cursor-not-allowed mb-3 opacity-50"
                      >
                        🔒 Créditos Insuficientes
                      </button>
                      <Link
                        href="/credits/purchase"
                        className="inline-block text-sm text-yellow-400 hover:text-yellow-300 transition duration-200 px-4 py-2 bg-yellow-600/20 rounded-lg hover:bg-yellow-600/30"
                      >
                        💰 Comprar mais créditos →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center justify-center">
              <span className="mr-3">💡</span>
              Como Funciona?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-gray-300">
              <div className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl mb-3 group-hover:animate-pulse">🎯</div>
                <h3 className="text-lg font-semibold text-white mb-2">Probabilidades Únicas</h3>
                <p>Cada pacote tem probabilidades diferentes para cada raridade, oferecendo estratégias diversas</p>
              </div>
              <div className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl mb-3 group-hover:animate-spin">🎲</div>
                <h3 className="text-lg font-semibold text-white mb-2">Sistema Justo</h3>
                <p>Aleatoriedade certificada e transparente, garantindo experiência fair para todos os colecionadores</p>
              </div>
              <div className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className="text-4xl mb-3 group-hover:animate-bounce">🏆</div>
                <h3 className="text-lg font-semibold text-white mb-2">Raridades Valiosas</h3>
                <p>Quanto maior a raridade, maior o valor em créditos e prestígio na sua coleção épica</p>
              </div>
            </div>
          </div>

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