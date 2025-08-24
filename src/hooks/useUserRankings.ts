import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserRanking {
  category: string
  position: number
  totalPlayers: number
  percentage: number
}

interface UserRankingData {
  totalXP: UserRanking
  packOpener: UserRanking
  collector: UserRanking
  trader: UserRanking
  bestRanking: UserRanking
  loading: boolean
  error: string | null
}

export const useUserRankings = (): UserRankingData => {
  const { data: session } = useSession()
  const [rankings, setRankings] = useState<Record<string, UserRanking>>({})
  const [globalRankingData, setGlobalRankingData] = useState<UserRanking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache key for localStorage
  const getCacheKey = (userId: string) => `userRankings_${userId}`
  const getGlobalCacheKey = (userId: string) => `globalRanking_${userId}`

  // Verificar cache antes de fazer requisições
  const getCachedRankings = (userId: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(userId))
      const globalCached = localStorage.getItem(getGlobalCacheKey(userId))
      
      if (cached && globalCached) {
        const cachedData = JSON.parse(cached)
        const globalCachedData = JSON.parse(globalCached)
        
        // Cache válido por 2 minutos
        if (Date.now() - cachedData.timestamp < 2 * 60 * 1000) {
          setRankings(cachedData.rankings)
          setGlobalRankingData(globalCachedData.ranking)
          return true
        }
      }
    } catch (error) {
      console.error('Error reading rankings cache:', error)
    }
    return false
  }

  // Salvar no cache
  const setCachedRankings = (userId: string, rankings: Record<string, UserRanking>, globalRanking: UserRanking | null) => {
    try {
      localStorage.setItem(getCacheKey(userId), JSON.stringify({
        rankings,
        timestamp: Date.now()
      }))
      if (globalRanking) {
        localStorage.setItem(getGlobalCacheKey(userId), JSON.stringify({
          ranking: globalRanking,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error caching rankings:', error)
    }
  }

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    // Verificar cache primeiro
    const hasCachedData = getCachedRankings(session.user.id)
    if (hasCachedData) {
      return // Usar dados do cache
    }

    const fetchAllRankingsData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar todos os dados em paralelo para melhor performance
        const [userResponse, rankingResponse, globalResponse] = await Promise.all([
          fetch(`/api/user/${session.user.id}/stats`, {
            headers: { 'Cache-Control': 'max-age=120' } // Cache 2min
          }),
          fetch('/api/rankings?action=stats', {
            headers: { 'Cache-Control': 'max-age=300' } // Cache 5min
          }),
          fetch(`/api/rankings/global?action=user-position&userId=${session.user.id}`, {
            headers: { 'Cache-Control': 'max-age=180' } // Cache 3min
          })
        ])
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user rankings')
        }

        const data = await userResponse.json()
        let totalPlayers = 1000 // fallback value
        
        if (rankingResponse.ok) {
          const rankingData = await rankingResponse.json()
          totalPlayers = rankingData.totalPlayers || 1000
        }

        // Calculate rankings based on user position data
        const userRankings: Record<string, UserRanking> = {}

        // Process each ranking category from user rankings data
        if (data.rankings) {
          Object.entries(data.rankings).forEach(([category, position]) => {
            const pos = position as number
            userRankings[category] = {
              category,
              position: pos,
              totalPlayers,
              percentage: ((totalPlayers - pos + 1) / totalPlayers) * 100
            }
          })
        }

        setRankings(userRankings)

        // Processar global ranking
        let globalRanking: UserRanking | null = null
        if (globalResponse.ok) {
          const globalData = await globalResponse.json()
          globalRanking = {
            category: 'GLOBAL',
            position: globalData.position || 0,
            totalPlayers: globalData.totalPlayers || 1000,
            percentage: globalData.globalPercentage || 0
          }
          setGlobalRankingData(globalRanking)
        }

        // Salvar no cache
        setCachedRankings(session.user.id, userRankings, globalRanking)

      } catch (err) {
        console.error('Error fetching user rankings:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAllRankingsData()
  }, [session?.user?.id])

  const bestRanking = globalRankingData || { category: 'GLOBAL', position: 0, totalPlayers: 0, percentage: 0 }

  return {
    totalXP: rankings['TOTAL_XP'] || { category: 'TOTAL_XP', position: 0, totalPlayers: 0, percentage: 0 },
    packOpener: rankings['PACK_OPENER'] || { category: 'PACK_OPENER', position: 0, totalPlayers: 0, percentage: 0 },
    collector: rankings['COLLECTOR'] || { category: 'COLLECTOR', position: 0, totalPlayers: 0, percentage: 0 },
    trader: rankings['TRADER'] || { category: 'TRADER', position: 0, totalPlayers: 0, percentage: 0 },
    bestRanking: bestRanking || { category: 'TOTAL_XP', position: 0, totalPlayers: 0, percentage: 0 },
    loading,
    error
  }
}