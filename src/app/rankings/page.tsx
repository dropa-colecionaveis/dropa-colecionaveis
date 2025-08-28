'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserRankings } from '@/hooks/useUserRankings'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAdmin } from '@/hooks/useAdmin'
import { RankingsSkeleton, RankingCategoriesSkeleton, UserRankingStatsSkeleton, HeaderStatsSkeleton } from '@/components/SkeletonLoader'

interface RankingEntry {
  userId: string
  username: string
  position: number
  value: number
}

interface RankingCategory {
  key: string
  name: string
  icon: string
  description: string
}

interface UserStats {
  totalXP: number
  level: number
  rankings: Record<string, number>
}

interface GlobalRankingEntry {
  userId: string
  username: string
  position: number
  globalScore: number
  globalPercentage: number
  categoryBreakdown: CategoryBreakdown[]
  totalCategories: number
}

interface CategoryBreakdown {
  category: string
  position: number
  totalInCategory: number
  points: number
  percentage: number
  weight: number
  contribution: number
}

interface GlobalRankingInfo {
  description: string
  formula: string
  weights: Record<string, number>
  explanation: string[]
}

export default function Rankings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [rankingsLoading, setRankingsLoading] = useState(false)
  const [userStatsLoading, setUserStatsLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('GLOBAL')
  const [userPosition, setUserPosition] = useState<number>(0)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [globalRankings, setGlobalRankings] = useState<GlobalRankingEntry[]>([])
  const [globalRankingInfo, setGlobalRankingInfo] = useState<GlobalRankingInfo | null>(null)
  const [showGlobalRanking, setShowGlobalRanking] = useState(true)
  const [globalRankingLoading, setGlobalRankingLoading] = useState(false)
  const [userGlobalPosition, setUserGlobalPosition] = useState<{
    position: number,
    globalScore: number,
    globalPercentage: number,
    categoryBreakdown: CategoryBreakdown[]
  } | null>(null)
  const [totalXPPosition, setTotalXPPosition] = useState<number>(0)
  const [lastKnownPositions, setLastKnownPositions] = useState<Record<string, number>>({})
  const { bestRanking, loading: rankingLoading } = useUserRankings()
  const { isAdmin, isSuperAdmin } = useAdmin()

  const categories: RankingCategory[] = [
    {
      key: 'GLOBAL',
      name: 'Ranking Global',
      icon: '🏆',
      description: 'Ranking geral baseado na performance em todas as categorias'
    },
    {
      key: 'TOTAL_XP',
      name: 'Total XP',
      icon: '⭐',
      description: 'Experiência total acumulada através de conquistas'
    },
    {
      key: 'PACK_OPENER',
      name: 'Abridor de Pacotes',
      icon: '📦',
      description: 'Maior número de pacotes abertos'
    },
    {
      key: 'COLLECTOR',
      name: 'Colecionador',
      icon: '🏆',
      description: 'Maior quantidade de itens únicos'
    },
    {
      key: 'TRADER',
      name: 'Comerciante',
      icon: '💰',
      description: 'Mais transações no marketplace'
    },
    {
      key: 'WEEKLY_ACTIVE',
      name: 'Streak Atual',
      icon: '🔥',
      description: 'Sequência atual de dias consecutivos ativos'
    },
    {
      key: 'MONTHLY_ACTIVE',
      name: 'Melhor Streak',
      icon: '📅',
      description: 'Maior sequência de dias consecutivos já alcançada'
    }
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    } 
    
    if (status === 'authenticated' && session?.user) {
      // Carregamento progressivo para melhor UX
      fetchRankingsProgressive()
    }
  }, [status, router, session])

  useEffect(() => {
    // Atualizar rankings quando categoria muda
    if (status === 'authenticated' && session?.user) {
      fetchRankings()
    }
  }, [selectedCategory])

  // Sincronizar showGlobalRanking com selectedCategory na inicialização
  useEffect(() => {
    setShowGlobalRanking(selectedCategory === 'GLOBAL')
  }, [selectedCategory])

  // Carregamento progressivo para rankings
  const fetchRankingsProgressive = async () => {
    // 1. Buscar dados do usuário primeiro (mais rápido)
    fetchUserProfile()
    fetchUserStats()
    fetchTotalXPPosition()
    
    // 2. Buscar rankings depois
    setTimeout(() => {
      fetchRankings()
    }, 100)
  }

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await fetch('/api/user/profile', {
        headers: { 'Cache-Control': 'max-age=300' } // Cache 5min
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

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  const fetchRankings = async (noCache = false) => {
    try {
      setRankingsLoading(true)
      
      if (selectedCategory === 'GLOBAL') {
        await fetchGlobalRankings()
      } else {
        const url = `/api/rankings/${selectedCategory}?limit=100${noCache ? `&_t=${Date.now()}` : ''}`
        // Categorias de streak têm cache menor pois são mais dinâmicas
        const isStreakCategory = ['WEEKLY_ACTIVE', 'MONTHLY_ACTIVE'].includes(selectedCategory)
        const cacheTime = isStreakCategory ? 30 : 120 // 30s para streak, 2min para outros
        
        const fetchOptions = noCache ? 
          { 
            cache: 'no-store' as RequestCache,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          } : 
          {
            next: { 
              revalidate: cacheTime,
              tags: [`rankings-${selectedCategory}`] 
            }
          }
        
        const response = await fetch(url, fetchOptions)
        if (response.ok) {
          const data = await response.json()
          if (noCache) {
            console.log(`🔄 Rankings fetched without cache for ${selectedCategory}:`, data)
          } else {
            console.log('Rankings data:', data)
          }
          setRankings(data.rankings || [])
          setUserPosition(data.userPosition || 0)
          
          // Armazenar posição conhecida para esta categoria
          if (data.userPosition > 0) {
            setLastKnownPositions(prev => ({
              ...prev,
              [selectedCategory]: data.userPosition
            }))
          }
        } else {
          console.error('Error fetching rankings - Response not ok:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('Error response:', errorText)
        }
      }
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setRankingsLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      setUserStatsLoading(true)
      const response = await fetch('/api/user/stats', {
        headers: { 'Cache-Control': 'max-age=180' } // Cache 3min
      })
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setUserStatsLoading(false)
    }
  }

  const fetchTotalXPPosition = async () => {
    try {
      const response = await fetch(`/api/rankings/TOTAL_XP?action=user-position&userId=${session?.user?.id}`, {
        headers: { 'Cache-Control': 'max-age=180' } // Cache 3min
      })
      if (response.ok) {
        const data = await response.json()
        setTotalXPPosition(data.position || 0)
      }
    } catch (error) {
      console.error('Error fetching TOTAL_XP position:', error)
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400' // Ouro
      case 2: return 'text-gray-300'   // Prata
      case 3: return 'text-orange-400' // Bronze
      default: return 'text-white'
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '👑'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return position <= 10 ? '🏆' : `#${position}`
    }
  }

  const formatValue = (value: number, category: string) => {
    switch (category) {
      case 'TOTAL_XP':
        return `${value.toLocaleString()} XP`
      case 'PACK_OPENER':
        return `${value} pacotes`
      case 'COLLECTOR':
        return `${value} itens`
      case 'TRADER':
        return `${value} transações`
      case 'WEEKLY_ACTIVE':
      case 'MONTHLY_ACTIVE':
        return `${value} dias`
      default:
        return value.toString()
    }
  }

  const fetchGlobalRankings = async () => {
    try {
      setGlobalRankingLoading(true)
      const response = await fetch(`/api/rankings/global?limit=50&_t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setGlobalRankings(data.rankings || [])
        setGlobalRankingInfo(data.info)
        setUserGlobalPosition(data.userPosition)
      } else {
        console.error('Error fetching global rankings')
      }
    } catch (error) {
      console.error('Error fetching global rankings:', error)
    } finally {
      setGlobalRankingLoading(false)
    }
  }

  const forceUpdateRankings = async () => {
    try {
      setUpdateLoading(true)
      
      if (selectedCategory === 'GLOBAL') {
        // Para ranking global, atualizar todas as categorias COM FORÇA
        await Promise.all([
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'TOTAL_XP', forceUpdate: true })
          }),
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'TRADER', forceUpdate: true })
          }),
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'PACK_OPENER', forceUpdate: true })
          }),
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'COLLECTOR', forceUpdate: true })
          }),
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'WEEKLY_ACTIVE', forceUpdate: true })
          }),
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'MONTHLY_ACTIVE', forceUpdate: true })
          })
        ])
        
        // Limpar cache do global ranking
        try {
          const response = await fetch('/api/rankings/global?action=clear-cache', {
            method: 'POST'
          })
          if (response.ok) {
            console.log('✅ Global cache cleared')
          }
        } catch (error) {
          console.log('Cache clear error (non-critical):', error)
        }
      } else if (selectedCategory === 'WEEKLY_ACTIVE' || selectedCategory === 'MONTHLY_ACTIVE') {
        // Se está nas categorias de streak, atualizar ambas para garantir consistência
        await Promise.all([
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'WEEKLY_ACTIVE', forceUpdate: true })
          }),
          fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', category: 'MONTHLY_ACTIVE', forceUpdate: true })
          })
        ])
      } else {
        // Para outras categorias individuais, forçar atualização
        const response = await fetch('/api/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', category: selectedCategory, forceUpdate: true })
        })
        
        if (!response.ok) {
          console.error('Error updating rankings')
          return
        }
      }
      
      // Aguardar mais tempo para garantir propagação dos dados
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Forçar limpeza de estados antes de buscar novos dados
      if (selectedCategory !== 'GLOBAL') {
        setRankings([])
        setUserPosition(0)
      } else {
        setGlobalRankings([])
        setUserGlobalPosition(null)
      }
      
      // Aguardar render
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Recarregar rankings após atualização SEM CACHE
      await fetchRankings(true) // noCache = true
      if (showGlobalRanking) {
        await fetchGlobalRankings()
      }
      
      console.log(`✅ ${selectedCategory} ranking updated successfully`)
      
      // Se ainda não atualizou após 2 segundos, forçar reload da página
      setTimeout(() => {
        if (selectedCategory !== 'GLOBAL' && rankings.length === 0) {
          console.log('🔄 Rankings still empty, forcing page reload...')
          window.location.reload()
        } else if (selectedCategory === 'GLOBAL' && globalRankings.length === 0) {
          console.log('🔄 Global rankings still empty, forcing page reload...')
          window.location.reload()
        }
      }, 2000)
    } catch (error) {
      console.error('Error updating rankings:', error)
    } finally {
      setUpdateLoading(false)
    }
  }

  const getCurrentCategory = () => {
    return categories.find(cat => cat.key === selectedCategory) || categories[0]
  }

  // Don't block the entire page on session loading
  // if (status === 'loading') {
  //   return <LoadingSpinner /> - removed to prevent blocking
  // }

  // Handle redirect for unauthenticated users
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Allow page to render even without session initially
  // if (!session?.user) {
  //   return <LoadingSpinner /> - removed to prevent blocking
  // }

  const currentCategory = getCurrentCategory()

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
                  🏆 <span className="text-purple-300">Rankings</span>
                </div>
                <div className="text-gray-400 text-sm">Veja como você se compara aos outros jogadores</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-4">
              {profileLoading || (!userStats && !userProfile) ? (
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
              {bestRanking.position > 0 && (
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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="mr-3">🏆</span>
              Rankings
            </h1>
            <p className="text-gray-300 text-lg">
              Veja como você se compara aos outros jogadores
            </p>
          </div>

          {/* User Stats Cards */}
          {userStatsLoading && !userStats ? (
            <UserRankingStatsSkeleton />
          ) : userStats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">⭐</div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{userStats.level}</div>
                <div className="text-sm text-gray-300">Seu Nível</div>
              </div>
              
              <div className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-bounce">⚡</div>
                <div className="text-3xl font-bold text-green-400 mb-1">{userStats.totalXP.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Total XP</div>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">📊</div>
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {selectedCategory === 'GLOBAL' 
                    ? (bestRanking.position > 0 ? `#${bestRanking.position}` : 'Não rankeado')
                    : (() => {
                        // Lógica mais robusta para determinar posição
                        const apiPosition = userPosition > 0 ? userPosition : 0
                        const statsPosition = userStats?.rankings?.[selectedCategory] > 0 ? userStats.rankings[selectedCategory] : 0
                        const lastKnownPosition = lastKnownPositions[selectedCategory] || 0
                        
                        // Se temos posição da API atual, usar ela
                        if (apiPosition > 0) {
                          return `#${apiPosition}`
                        }
                        
                        // Se não temos posição atual mas temos uma posição conhecida (durante carregamento), usar ela
                        if (rankingsLoading && lastKnownPosition > 0) {
                          return `#${lastKnownPosition}`
                        }
                        
                        // Se não, verificar se temos dados nas stats
                        if (statsPosition > 0) {
                          return `#${statsPosition}`
                        }
                        
                        // Se temos posição conhecida como fallback
                        if (lastKnownPosition > 0) {
                          return `#${lastKnownPosition}`
                        }
                        
                        // Default
                        return 'Não rankeado'
                      })()
                  }
                </div>
                <div className="text-sm text-gray-300">
                  {selectedCategory === 'GLOBAL' ? 'Posição Global' : 'Posição Atual'}
                </div>
              </div>
              
              <div className="group bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-spin">🏆</div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {totalXPPosition > 0 ? `#${totalXPPosition}` : '--'}
                </div>
                <div className="text-sm text-gray-300">Ranking Total XP</div>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center">
              <span className="mr-3">📊</span>
              Categorias de Ranking
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => {
      // Só limpar dados se realmente mudou de categoria
      if (selectedCategory !== category.key) {
        setSelectedCategory(category.key)
        // Limpar dados da categoria anterior imediatamente para feedback visual
        setRankings([])
        setUserPosition(0)
        setGlobalRankings([])
      }
    }}
                  className={`group p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl text-left ${
                    selectedCategory === category.key
                      ? 'bg-gradient-to-br from-white/30 to-white/20 border-white/50 text-white'
                      : 'bg-gradient-to-br from-white/5 to-white/2 border-white/10 text-gray-300 hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="text-3xl group-hover:animate-pulse">{category.icon}</span>
                    <span className="font-bold text-lg">{category.name}</span>
                  </div>
                  <p className="text-sm opacity-80 leading-relaxed">{category.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Current Category Info - Para categorias normais */}
          {!showGlobalRanking && (
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
              <div className="flex items-center space-x-6 mb-6">
                <div className="text-6xl animate-pulse">{currentCategory.icon}</div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{currentCategory.name}</h2>
                  <p className="text-gray-300 text-lg">{currentCategory.description}</p>
                </div>
              </div>
              
              {userPosition > 0 && (
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-2xl p-6 shadow-lg">
                  <div className="text-blue-400 font-bold text-lg mb-3 flex items-center">
                    <span className="mr-2">🎯</span>
                    Sua Posição Atual
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{getPositionIcon(userPosition)}</span>
                    <span className="text-3xl font-bold text-white">#{userPosition}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sua Posição Global - Para ranking global */}
          {showGlobalRanking && bestRanking.position > 0 && (
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 rounded-2xl p-6 shadow-lg mb-8">
              <div className="text-purple-400 font-bold text-lg mb-3 flex items-center">
                <span className="mr-2">🎯</span>
                Sua Posição Global
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{getPositionIcon(bestRanking.position)}</span>
                  <div>
                    <div className="text-3xl font-bold text-white">#{bestRanking.position}</div>
                    <div className="text-purple-300 text-sm">Posição Global</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-300">
                    {Math.round(bestRanking.percentage)}%
                  </div>
                  <div className="text-purple-400 text-sm">Score Global</div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings List */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 shadow-xl">
            <div className="p-8 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <span className="mr-3">🏆</span>
                  Leaderboard - {currentCategory.name}
                </h3>
                
                {/* Botão Fix para cada categoria */}
                <button
                  onClick={forceUpdateRankings}
                  disabled={updateLoading}
                  className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-600 text-white rounded text-xs font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  title={`Atualizar ranking ${currentCategory.name}`}
                >
                  {updateLoading ? '🔄' : '🔄 Atualizar'}
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-white/10">
              {rankingsLoading && (!rankings.length && !globalRankings.length) ? (
                <div className="p-6">
                  <RankingsSkeleton />
                </div>
              ) : showGlobalRanking ? (
                /* Global Rankings List */
                globalRankings.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`group p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.01] ${
                      entry.userId === session?.user?.id ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-l-4 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className={`text-3xl min-w-[80px] text-center ${getPositionColor(entry.position)} group-hover:animate-pulse`}>
                          {getPositionIcon(entry.position)}
                        </div>
                        
                        <div>
                          <div className={`font-bold text-lg ${entry.userId === session?.user?.id ? 'text-purple-400' : 'text-white'}`}>
                            {entry.username}
                            {entry.userId === session?.user?.id && (
                              <span className="ml-3 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 rounded-full text-white font-semibold animate-pulse">Você</span>
                            )}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {entry.totalCategories} categoria{entry.totalCategories !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-white font-bold text-lg mb-1">
                          {entry.globalPercentage.toFixed(1)}%
                        </div>
                        <div className="text-gray-400 text-sm font-medium">
                          #{entry.position}
                        </div>
                      </div>
                    </div>

                    {/* Category Breakdown for Current User */}
                    {entry.userId === session?.user?.id && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-purple-300 font-bold mb-3 flex items-center">
                          <span className="mr-2">📊</span>
                          Seu Breakdown por Categoria
                        </h4>
                        <div className="space-y-4">
                          {/* Categorias com ranking */}
                          <div>
                            <h5 className="text-green-300 font-medium mb-2 text-sm">✅ Categorias com ranking:</h5>
                            <div className="grid md:grid-cols-2 gap-3">
                              {entry.categoryBreakdown.filter(breakdown => breakdown.position > 0).map((breakdown) => {
                                const categoryInfo = categories.find(c => c.key === breakdown.category)
                                return (
                                  <div key={breakdown.category} className="bg-black/20 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-white text-sm font-medium">
                                        {categoryInfo?.name || breakdown.category}
                                      </span>
                                      <span className="text-purple-300 text-sm font-bold">
                                        #{breakdown.position}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-gray-400">
                                        {breakdown.percentage.toFixed(1)}% × {(breakdown.weight * 100).toFixed(0)}%
                                      </span>
                                      <span className="text-green-300">
                                        +{(breakdown.contribution * 100).toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Categorias sem ranking */}
                          {entry.categoryBreakdown.filter(breakdown => breakdown.position === 0).length > 0 && (
                            <div>
                              <h5 className="text-orange-300 font-medium mb-2 text-sm">⏳ Categorias para melhorar:</h5>
                              <div className="grid md:grid-cols-2 gap-3">
                                {entry.categoryBreakdown.filter(breakdown => breakdown.position === 0).map((breakdown) => {
                                  const categoryInfo = categories.find(c => c.key === breakdown.category)
                                  return (
                                    <div key={breakdown.category} className="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-400 text-sm font-medium">
                                          {categoryInfo?.name || breakdown.category}
                                        </span>
                                        <span className="text-gray-500 text-sm font-bold">
                                          Não rankeado
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">
                                          0% × {(breakdown.weight * 100).toFixed(0)}%
                                        </span>
                                        <span className="text-gray-500">
                                          +0.0
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                /* Regular Category Rankings */
                rankings.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`group p-6 flex items-center justify-between hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.01] ${
                      entry.userId === session?.user?.id ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`text-3xl min-w-[80px] text-center ${getPositionColor(entry.position)} group-hover:animate-pulse`}>
                        {getPositionIcon(entry.position)}
                      </div>
                      
                      <div>
                        <div className={`font-bold text-lg ${entry.userId === session?.user?.id ? 'text-blue-400' : 'text-white'}`}>
                          {entry.username}
                          {entry.userId === session?.user?.id && (
                            <span className="ml-3 text-xs bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 rounded-full text-white font-semibold animate-pulse">Você</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-white font-bold text-lg mb-1">
                        {formatValue(entry.value, selectedCategory)}
                      </div>
                      <div className="text-gray-400 text-sm font-medium">
                        #{entry.position}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {(showGlobalRanking ? globalRankings.length === 0 : rankings.length === 0) && !rankingsLoading && !globalRankingLoading && (
              <div className="p-12 text-center">
                <div className="text-8xl mb-6 animate-bounce">🏆</div>
                <h3 className="text-3xl font-bold text-white mb-4">Nenhum ranking encontrado</h3>
                <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                  {selectedCategory === 'TOTAL_XP' 
                    ? 'Complete conquistas para ganhar XP e aparecer no ranking!'
                    : 'Seja o primeiro a aparecer neste ranking!'
                  }
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={forceUpdateRankings}
                    disabled={updateLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold"
                  >
                    {updateLoading ? '🔄 Atualizando...' : '🔄 Atualizar Rankings'}
                  </button>
                  <Link
                    href="/achievements"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold"
                  >
                    🏆 Ver Conquistas
                  </Link>
                </div>
                <div className="mt-6 text-sm text-gray-400">
                  Rankings são atualizados automaticamente a cada hora
                </div>
              </div>
            )}
          </div>

          {/* Global Ranking Explanations - Aparecem após o leaderboard quando em ranking global */}
          {showGlobalRanking && globalRankingInfo && (
            <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-lg rounded-2xl p-8 mt-8 border border-purple-500/30 shadow-xl">
              <div className="flex items-center space-x-6 mb-8">
                <div className="text-6xl animate-pulse">🏆</div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Como Funciona o Ranking Global</h2>
                  <p className="text-gray-300 text-lg">Entenda a metodologia e os pesos das categorias</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Explicação do Sistema */}
                <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/40 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-indigo-300 mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    Como Funciona o Ranking Global
                  </h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {globalRankingInfo.description}
                  </p>
                  <div className="bg-black/20 rounded-lg p-3 mb-4">
                    <code className="text-green-300 text-sm">{globalRankingInfo.formula}</code>
                  </div>
                </div>

                {/* Pesos das Categorias */}
                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/40 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                    <span className="mr-2">⚖️</span>
                    Pesos das Categorias
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(globalRankingInfo.weights).map(([category, weight]) => {
                      const categoryName = categories.find(c => c.key === category)?.name || category
                      const percentage = (weight * 100).toFixed(0)
                      return (
                        <div key={category} className="flex justify-between items-center bg-black/20 rounded-lg p-3">
                          <span className="text-white font-medium">{categoryName}</span>
                          <div className="flex items-center space-x-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${weight * 100}px` }}></div>
                            <span className="text-blue-300 font-bold">{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Explicação Detalhada */}
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/40 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center">
                    <span className="mr-2">📝</span>
                    Explicação Detalhada
                  </h3>
                  <div className="space-y-2">
                    {globalRankingInfo.explanation.map((line, index) => (
                      <div key={index} className="text-gray-300 text-sm leading-relaxed">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12 space-y-6">
            <div className="text-gray-400 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="font-medium mb-2">📊 Estatísticas do Ranking</div>
              <div className="text-sm">
                Rankings atualizados a cada hora • {showGlobalRanking ? globalRankings.length : rankings.length} jogadores classificados
              </div>
            </div>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
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
    </div>
  )
}