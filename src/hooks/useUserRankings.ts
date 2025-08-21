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

        // Fetch user stats which includes ranking positions
        const response = await fetch(`/api/user/${session.user.id}/stats`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch user rankings')
        }

        const data = await response.json()
        
        // Fetch total players count for percentage calculation
        const rankingResponse = await fetch('/api/rankings?action=stats')
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

        // If we don't have direct ranking data, try to fetch from rankings API
        if (Object.keys(userRankings).length === 0) {
          try {
            // Fetch user's actual ranking positions from all categories
            const categories = ['TOTAL_XP', 'PACK_OPENER', 'COLLECTOR', 'TRADER', 'WEEKLY_ACTIVE', 'MONTHLY_ACTIVE']
            
            for (const category of categories) {
              const rankingResp = await fetch(`/api/rankings/${category}?limit=100`)
              if (rankingResp.ok) {
                const rankingData = await rankingResp.json()
                
                if (rankingData.rankings && rankingData.userPosition) {
                  userRankings[category] = {
                    category,
                    position: rankingData.userPosition,
                    totalPlayers: rankingData.total || rankingData.rankings.length,
                    percentage: ((rankingData.total - rankingData.userPosition + 1) / rankingData.total) * 100
                  }
                }
              }
            }
          } catch (error) {
            console.log('No ranking data available yet')
          }
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

  // Fetch global ranking data
  const fetchGlobalRanking = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/rankings/global?action=user-position&userId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setGlobalRankingData({
          category: 'GLOBAL',
          position: data.position || 0,
          totalPlayers: 5, // Could be improved by fetching total from API
          percentage: data.globalPercentage || 0
        })
      }
    } catch (error) {
      console.error('Error fetching global ranking:', error)
    }
  }

  // Fetch global ranking when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchGlobalRanking()
    }
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