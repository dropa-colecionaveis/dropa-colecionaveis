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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const fetchUserRankings = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user stats and ranking stats in parallel for better performance
        const [userResponse, rankingResponse] = await Promise.all([
          fetch(`/api/user/${session.user.id}/stats`),
          fetch('/api/rankings?action=stats')
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
      } catch (err) {
        console.error('Error fetching user rankings:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRankings()
  }, [session?.user?.id])

  // Use actual global ranking from API instead of calculating manually
  const [globalRankingData, setGlobalRankingData] = useState<UserRanking | null>(null)

  // Fetch global ranking only when needed (optimized)
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchGlobalRanking = async () => {
      try {
        const response = await fetch(`/api/rankings/global?action=user-position&userId=${session.user.id}`)
        if (response.ok) {
          const data = await response.json()
          setGlobalRankingData({
            category: 'GLOBAL',
            position: data.position || 0,
            totalPlayers: data.totalPlayers || 1000,
            percentage: data.globalPercentage || 0
          })
        }
      } catch (error) {
        console.error('Error fetching global ranking:', error)
      }
    }

    // Only fetch global ranking if we have other rankings data
    if (Object.keys(rankings).length > 0) {
      fetchGlobalRanking()
    }
  }, [session?.user?.id, rankings])

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