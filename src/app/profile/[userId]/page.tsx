'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import { PublicProfileSkeleton, CollectionCardSkeleton } from '@/components/SkeletonLoader'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  unlockedAt: string
}

interface Collection {
  id: string
  name: string
  description: string
  theme?: string
  completedAt?: string
  imageUrl?: string
  totalItems: number
  itemsOwned: number
  completionPercentage: number
  isCompleted: boolean
  userOwnedItems?: Array<{
    id: string
    name: string
    imageUrl: string
    rarity: string
    value: number
    obtainedAt: string
  }>
}

interface RareItem {
  id: string
  name: string
  imageUrl: string
  rarity: string
  value: number
  obtainedAt: string
}

interface Ranking {
  category: string
  position: number
  value: number
}

interface UserProfile {
  id: string
  name: string
  profileImage?: string
  memberSince: string
  stats: {
    level: number
    totalXP: number
    currentStreak: number
    longestStreak: number
    totalPacksOpened: number
    totalItems: number
    totalAchievements: number
  }
  rankings: Ranking[]
  achievements: Achievement[]
  completedCollections: Collection[]
  rareItems: RareItem[]
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<any>(null)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userId = params.userId as string

  useEffect(() => {
    fetchProfile()
    fetchCollections()
  }, [userId, session]) // Add session dependency to refetch when session updates

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if viewing own profile to disable cache
      const isOwnProfile = session?.user?.id === userId
      
      const response = await fetch(`/api/profile/${userId}`, {
        headers: isOwnProfile ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        } : {
          'Cache-Control': 'max-age=300'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data.profile)
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      setError(error.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      setCollectionsLoading(true)

      const response = await fetch(`/api/profile/${userId}/collections`)

      if (!response.ok) {
        console.error('Failed to fetch collections')
        return
      }

      const data = await response.json()
      if (data.success) {
        setCollections(data.collections)
      }
    } catch (error: any) {
      console.error('Error fetching collections:', error)
    } finally {
      setCollectionsLoading(false)
    }
  }

  const openCollectionDetails = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/profile/${userId}/collections/${collectionId}`)
      
      if (!response.ok) {
        console.error('Failed to fetch collection details')
        return
      }

      const data = await response.json()
      if (data.success) {
        setSelectedCollection(data)
        setShowCollectionModal(true)
      }
    } catch (error: any) {
      console.error('Error fetching collection details:', error)
    }
  }

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      'TOTAL_XP': 'Total XP',
      'PACK_OPENER': 'Abridor de Pacotes',
      'COLLECTOR': 'Colecionador',
      'TRADER': 'Comerciante',
      'WEEKLY_ACTIVE': 'Streak Atual',
      'MONTHLY_ACTIVE': 'Melhor Streak'
    }
    return categories[category] || category
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

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400'
      case 2: return 'text-gray-300'  
      case 3: return 'text-orange-400'
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

  if (loading) {
    return <PublicProfileSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 border border-red-500/30">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile não encontrado</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <PublicProfileSkeleton />
  }

  const isOwnProfile = session?.user?.id === userId

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
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
              <div className="hidden md:block">
                <div className="text-white font-medium">
                  👤 <span className="text-purple-300">Profile Público</span>
                </div>
                <div className="text-gray-400 text-sm">{profile.name}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isOwnProfile && (
                <Link
                  href="/profile/settings"
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  ⚙️ Configurações
                </Link>
              )}
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 font-medium"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8 mb-8 border border-white/20 shadow-xl">
            {/* Mobile Layout - Centered */}
            <div className="block md:hidden text-center mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg overflow-hidden mb-4">
                {profile.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">{profile.name}</h1>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center justify-center space-x-2">
                  <span>⭐</span>
                  <span>Nível {profile.stats.level}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>📅</span>
                  <span>Membro desde {new Date(profile.memberSince).toLocaleDateString('pt-BR')}</span>
                </div>
                {isOwnProfile && (
                  <div className="mt-3">
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 rounded-full text-white text-sm font-semibold">Seu Profile</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout - Horizontal */}
            <div className="hidden md:flex items-center space-x-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg overflow-hidden">
                {profile.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                <div className="flex items-center space-x-4 text-gray-300">
                  <span>⭐ Nível {profile.stats.level}</span>
                  <span>📅 Membro desde {new Date(profile.memberSince).toLocaleDateString('pt-BR')}</span>
                  {isOwnProfile && <span className="bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 rounded-full text-white text-sm font-semibold">Seu Profile</span>}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-4 text-center border border-blue-500/30">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-2xl font-bold text-blue-400">{profile.stats.totalXP.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Total XP</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-4 text-center border border-green-500/30">
                <div className="text-2xl mb-1">📦</div>
                <div className="text-2xl font-bold text-green-400">{profile.stats.totalPacksOpened}</div>
                <div className="text-sm text-gray-300">Pacotes Abertos</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 text-center border border-purple-500/30">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-2xl font-bold text-purple-400">{profile.stats.totalItems}</div>
                <div className="text-sm text-gray-300">Total Itens</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-4 text-center border border-yellow-500/30">
                <div className="text-2xl mb-1">🏅</div>
                <div className="text-2xl font-bold text-yellow-400">{profile.stats.totalAchievements}</div>
                <div className="text-sm text-gray-300">Conquistas</div>
              </div>
            </div>
          </div>

          {/* Rankings */}
          {profile.rankings.length > 0 && (
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🏆</span>
                Melhores Rankings
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.rankings.map((ranking) => (
                  <div key={ranking.category} className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{getCategoryName(ranking.category)}</div>
                        <div className="text-gray-400 text-sm">{formatValue(ranking.value, ranking.category)}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl ${getPositionColor(ranking.position)}`}>
                          {getPositionIcon(ranking.position)}
                        </div>
                        <div className="text-white font-bold">#{ranking.position}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Achievements */}
            {profile.achievements.length > 0 && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">🏅</span>
                  Conquistas Recentes
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {profile.achievements.slice(0, 8).map((achievement) => (
                    <div key={achievement.id} className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-xl p-4 border border-purple-500/30">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{achievement.name}</div>
                          <div className="text-gray-400 text-sm">{achievement.description}</div>
                          <div className="text-purple-300 text-xs mt-1">
                            +{achievement.points} pontos • {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rare Items */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">💎</span>
                Itens Raros
              </h2>
              {profile.rareItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {profile.rareItems.slice(0, 8).map((item) => (
                    <div key={item.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors">
                      <div className="aspect-square bg-gray-700/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium text-sm mb-1">{item.name}</div>
                        <div className={`text-xs font-bold ${getRarityColor(item.rarity)}`}>
                          {item.rarity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">💎</div>
                  <p className="text-gray-400 text-lg mb-2">Ainda não possui itens raros</p>
                  <p className="text-gray-500 text-sm">
                    Abra mais pacotes para encontrar itens de raridade RARO, ÉPICO ou LENDÁRIO
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Collections */}
          {collections.length > 0 && (
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mt-8 border border-white/20 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📚</span>
                Coleções ({collections.length})
              </h2>
              
              {collectionsLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <CollectionCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collections.map((collection) => (
                    <div 
                      key={collection.id} 
                      className={`rounded-xl p-6 border cursor-pointer transition-all duration-300 hover:scale-105 ${
                        collection.isCompleted 
                          ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 hover:border-green-400/50'
                          : 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 hover:border-blue-400/50'
                      }`}
                      onClick={() => openCollectionDetails(collection.id)}
                    >
                      <div className="text-center">
                        {collection.imageUrl && (
                          <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-gray-700/50">
                            <Image
                              src={collection.imageUrl}
                              alt={collection.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="text-4xl mb-3">
                          {collection.isCompleted ? '✅' : '📚'}
                        </div>
                        
                        <div className="text-white font-bold text-lg mb-2">{collection.name}</div>
                        <div className="text-gray-300 text-sm mb-3 line-clamp-2">{collection.description}</div>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>{collection.itemsOwned}/{collection.totalItems}</span>
                            <span>{collection.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                collection.isCompleted 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                              }`}
                              style={{ width: `${collection.completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className={`text-xs ${
                          collection.isCompleted ? 'text-green-300' : 'text-blue-300'
                        }`}>
                          {collection.isCompleted 
                            ? `Completa ${collection.completedAt ? 'em ' + new Date(collection.completedAt).toLocaleDateString('pt-BR') : ''}` 
                            : 'Em progresso'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12">
            <Link
              href="/rankings"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium mr-4"
            >
              🏆 Ver Rankings
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Collection Details Modal */}
      {showCollectionModal && selectedCollection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCollectionModal(false)}>
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-white/20 flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Compact Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {selectedCollection.collection.imageUrl && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-700/50">
                    <Image
                      src={selectedCollection.collection.imageUrl}
                      alt={selectedCollection.collection.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedCollection.collection.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1">{selectedCollection.collection.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCollectionModal(false)}
                className="text-gray-400 hover:text-white text-xl w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Compact Stats Bar */}
            <div className="p-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-center space-x-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{selectedCollection.collection.itemsOwned}</div>
                  <div className="text-xs text-gray-400">Possuídos</div>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{selectedCollection.collection.totalItems}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{selectedCollection.collection.completionPercentage}%</div>
                  <div className="text-xs text-gray-400">Completo</div>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">{selectedCollection.stats.missingItems}</div>
                  <div className="text-xs text-gray-400">Faltando</div>
                </div>
              </div>
              
              {/* Compact Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${selectedCollection.collection.completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Items Grid - Maximized Space */}
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {selectedCollection.itemsByRarity && (
                <div className="space-y-5">
                  {selectedCollection.rarityStats.map((rarityGroup: any) => (
                    <div key={rarityGroup.rarity} className="space-y-3">
                      {/* Compact Rarity Header */}
                      <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <h4 className={`text-base font-bold flex items-center space-x-2 ${getRarityColor(rarityGroup.rarity)}`}>
                          <span>{rarityGroup.rarity}</span>
                          <span className="text-sm text-gray-400">({rarityGroup.owned}/{rarityGroup.total})</span>
                        </h4>
                        <div className="text-sm text-gray-400">
                          {rarityGroup.percentage}% completo
                        </div>
                      </div>
                      
                      {/* Improved Items Grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {selectedCollection.itemsByRarity[rarityGroup.rarity].map((item: any) => (
                          <div 
                            key={item.id} 
                            className={`relative rounded-lg p-2 border transition-all duration-300 hover:scale-105 ${
                              item.owned 
                                ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30'
                                : 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-gray-500/30 opacity-60'
                            }`}
                          >
                            {item.owned && (
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">
                                ✓
                              </div>
                            )}
                            
                            {/* Larger Item Image */}
                            <div className="relative aspect-square bg-gray-700/50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                              <Image
                                src={item.imageUrl || '/placeholder-item.png'}
                                alt={item.owned ? item.name : 'Item bloqueado'}
                                width={80}
                                height={80}
                                className={`object-cover rounded-md ${!item.owned ? 'blur-sm grayscale opacity-30' : ''}`}
                              />
                              {!item.owned && (
                                <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
                                  <span className="text-white text-lg">🔒</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Compact Item Info */}
                            <div className="text-center">
                              <div className={`font-medium text-xs mb-1 line-clamp-2 leading-tight ${item.owned ? 'text-white' : 'text-gray-500'}`} title={item.owned ? item.name : 'Item não possuído'}>
                                {item.owned ? item.name : '???'}
                              </div>
                              <div className={`text-xs font-bold ${getRarityColor(item.rarity)}`}>
                                #{item.itemNumber}
                              </div>
                              {item.owned && item.obtainedAt && (
                                <div className="text-green-300 text-xs mt-1">
                                  {new Date(item.obtainedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </div>
                              )}
                              {item.isLimitedEdition && item.limitedEdition && (
                                <div className="text-yellow-300 text-xs mt-1">
                                  #{item.limitedEdition.serialNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}