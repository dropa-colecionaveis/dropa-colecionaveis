'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserRankings } from '@/hooks/useUserRankings'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  type: string
  points: number
  isSecret: boolean
  completionRate: number
  userProgress?: {
    progress: number
    isCompleted: boolean
    unlockedAt: string | null
  }
}

interface AchievementStats {
  total: number
  completed: number
  completionRate: number
  totalPoints: number
  recentUnlocks: Array<{
    achievement: Achievement
    unlockedAt: string
  }>
}

export default function Achievements() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE'>('ALL')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { bestRanking, loading: rankingLoading } = useUserRankings()

  const categories = [
    { key: 'ALL', name: 'Todas', icon: '🎯' },
    { key: 'COLLECTOR', name: 'Colecionador', icon: '🏆' },
    { key: 'EXPLORER', name: 'Explorador', icon: '🎁' },
    { key: 'TRADER', name: 'Comerciante', icon: '💰' },
    { key: 'MILESTONE', name: 'Marcos', icon: '🌟' },
    { key: 'SPECIAL', name: 'Especiais', icon: '✨' }
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchAchievements(true) // Mostrar loading apenas no carregamento inicial
      fetchUserStats()
      fetchUserProfile()
    }
  }, [status, router])

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
    }
  }

  const fetchAchievements = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      
      const params = new URLSearchParams()
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory)
      }
      // Incluir conquistas secretas
      params.append('includeSecret', 'true')
      
      const response = await fetch(`/api/user/achievements?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements.map((ua: any) => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          category: ua.achievement.category,
          type: ua.achievement.type,
          points: ua.achievement.points,
          isSecret: ua.achievement.isSecret,
          completionRate: Math.round(Math.random() * 100), // Placeholder para taxa de conclusão global
          userProgress: {
            progress: ua.progress,
            isCompleted: ua.isCompleted,
            unlockedAt: ua.unlockedAt
          }
        })))
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/achievements')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      // Não mostrar loading ao filtrar categoria para evitar scroll para o topo
      fetchAchievements()
    }
  }, [selectedCategory])

  const getFilteredAchievements = () => {
    let filtered = achievements

    if (filter === 'COMPLETED') {
      filtered = achievements.filter(a => a.userProgress?.isCompleted)
    } else if (filter === 'INCOMPLETE') {
      filtered = achievements.filter(a => !a.userProgress?.isCompleted)
    }

    return filtered
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'COLLECTOR': 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      'EXPLORER': 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      'TRADER': 'bg-green-500/20 border-green-500/30 text-green-400',
      'MILESTONE': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      'SPECIAL': 'bg-pink-500/20 border-pink-500/30 text-pink-400'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 border-gray-500/30 text-gray-400'
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

  const filteredAchievements = getFilteredAchievements()

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
                  🏆 <span className="text-purple-300">Conquistas</span>
                </div>
                <div className="text-gray-400 text-sm">Complete desafios e ganhe XP</div>
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
                {session?.user?.email === 'admin@admin.com' && (
                  <Link
                    href="/admin"
                    className="p-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105"
                    title="Admin"
                  >
                    🔧
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🏆 Conquistas</h1>
            <p className="text-gray-300">
              Complete desafios e desbloqueie conquistas para ganhar XP
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-bounce">🏆</div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.completed}</div>
                <div className="text-sm text-gray-300">Desbloqueadas</div>
              </div>
              
              <div className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">📈</div>
                <div className="text-3xl font-bold text-green-400 mb-1">{stats.completionRate}%</div>
                <div className="text-sm text-gray-300">Progresso</div>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-pulse">⚡</div>
                <div className="text-3xl font-bold text-purple-400 mb-1">{stats.totalPoints}</div>
                <div className="text-sm text-gray-300">XP Total</div>
              </div>
              
              <div className="group bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 text-center text-white border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
                <div className="text-3xl mb-2 group-hover:animate-spin">🎯</div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.total}</div>
                <div className="text-sm text-gray-300">Total</div>
              </div>
            </div>
          )}

          {/* Recent Unlocks */}
          {stats?.recentUnlocks && stats.recentUnlocks.length > 0 && (
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
                <span className="mr-3">🎉</span>
                Recém Desbloqueadas
              </h3>
              <div className="grid md:grid-cols-5 gap-6">
                {stats.recentUnlocks.map((unlock, index) => (
                  <div key={index} className="group text-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105 border border-white/10 hover:border-white/20">
                    <div className="text-5xl mb-3 group-hover:animate-bounce">{unlock.achievement.icon}</div>
                    <div className="text-white font-bold text-sm mb-1">{unlock.achievement.name}</div>
                    <div className="text-gray-400 text-xs">{formatDate(unlock.unlockedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center">
              <span className="mr-3">🔍</span>
              Filtros de Conquistas
            </h3>
            
            {/* Category Filter */}
            <div className="mb-8">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📂</span>
                Categorias
              </h4>
              <div className="flex flex-wrap gap-3">
                {categories.map(category => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                      selectedCategory === category.key
                        ? 'bg-gradient-to-r from-white/30 to-gray-300/30 text-white border-white/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Status
              </h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'ALL', name: 'Todas', icon: '🌏' },
                  { key: 'COMPLETED', name: 'Completas', icon: '✅' },
                  { key: 'INCOMPLETE', name: 'Incompletas', icon: '⏳' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as typeof filter)}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border-2 ${
                      filter === f.key
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border-transparent'
                    }`}
                  >
                    {f.icon} {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`group bg-gradient-to-br rounded-2xl p-6 border-2 transition-all duration-300 hover:transform hover:scale-[1.02] shadow-lg hover:shadow-2xl ${
                  achievement.userProgress?.isCompleted
                    ? `${getCategoryColor(achievement.category)} from-white/15 to-white/5`
                    : 'from-white/5 to-white/2 border-gray-600/30 text-gray-400'
                } ${achievement.isSecret && !achievement.userProgress?.isCompleted ? 'opacity-50' : ''}`}
              >
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3 group-hover:animate-bounce transition-all duration-300">
                    {achievement.isSecret && !achievement.userProgress?.isCompleted 
                      ? '❓' 
                      : achievement.icon
                    }
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">
                    {achievement.isSecret && !achievement.userProgress?.isCompleted
                      ? 'Conquista Secreta'
                      : achievement.name
                    }
                  </h3>
                  
                  <p className="text-sm mb-3">
                    {achievement.isSecret && !achievement.userProgress?.isCompleted
                      ? 'Complete certas condições para revelar'
                      : achievement.description
                    }
                  </p>
                  
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(achievement.category)}`}>
                    {achievement.category}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>XP:</span>
                    <span className="font-bold text-yellow-400">+{achievement.points}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span>Progresso Global:</span>
                    <span>{achievement.completionRate}% dos jogadores</span>
                  </div>

                  {achievement.userProgress?.isCompleted && (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl p-4 text-center shadow-lg">
                      <div className="text-green-400 font-bold text-sm flex items-center justify-center">
                        <span className="mr-2 animate-pulse">✅</span>
                        DESBLOQUEADA!
                      </div>
                      {achievement.userProgress.unlockedAt && (
                        <div className="text-green-300 text-xs mt-2 font-medium">
                          {formatDate(achievement.userProgress.unlockedAt)}
                        </div>
                      )}
                    </div>
                  )}

                  {!achievement.userProgress?.isCompleted && (
                    <div className="bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/40 rounded-xl p-4 text-center">
                      <div className="text-gray-400 text-sm font-medium flex items-center justify-center">
                        <span className="mr-2">🔒</span>
                        Não desbloqueada
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-20">
              <div className="text-8xl mb-6 animate-bounce">🏆</div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Nenhuma conquista encontrada
              </h2>
              <p className="text-gray-300 mb-8 text-lg max-w-md mx-auto">
                Experimente filtros diferentes ou comece a jogar para desbloquear conquistas épicas!
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => {
                    setSelectedCategory('ALL')
                    setFilter('ALL')
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🔄 Limpar Filtros
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🎮 Voltar ao Jogo
                </Link>
              </div>
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
    </div>
  )
}