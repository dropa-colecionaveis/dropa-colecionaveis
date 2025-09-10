'use client'

import { useState, useEffect } from 'react'
import DailyRewardsModal from './DailyRewardsModal'

interface StreakData {
  currentStreak: number
  hasClaimedToday: boolean
  todayReward: {
    rewardType: string
    adjustedValue: number
    canClaim: boolean
  } | null
}

interface StreakIndicatorProps {
  onRewardClaimed?: () => void
  compact?: boolean
}

export default function StreakIndicator({ onRewardClaimed, compact = false }: StreakIndicatorProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreakData()
  }, [])

  const fetchStreakData = async () => {
    try {
      const response = await fetch('/api/user/daily-rewards')
      
      if (response.ok) {
        const data = await response.json()
        setStreakData({
          currentStreak: data.currentStreak,
          hasClaimedToday: data.hasClaimedToday,
          todayReward: data.todayReward
        })
      } else {
        console.error('Failed to fetch streak data')
      }
    } catch (error) {
      console.error('Error fetching streak data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRewardClaimed = (reward: any) => {
    fetchStreakData() // Refresh data
    onRewardClaimed?.() // Callback to parent (dashboard)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        {compact ? (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">...</div>
            <div className="text-sm text-gray-500">Carregando</div>
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg p-3 w-32 h-16"></div>
        )}
      </div>
    )
  }

  if (!streakData) return null

  const hasUnclaimedReward = streakData.todayReward?.canClaim && !streakData.hasClaimedToday
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`relative transition-all duration-200 transform hover:scale-105 w-full h-full ${
          compact ? (
            hasUnclaimedReward
              ? 'animate-pulse' 
              : 'hover:opacity-80'
          ) : (
            `p-3 rounded-lg ${
              hasUnclaimedReward
                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400 animate-pulse'
                : 'bg-white/10 hover:bg-white/20 border border-white/20'
            }`
          )
        }`}
      >
        {/* Notification indicator */}
        {hasUnclaimedReward && (
          <div className={`absolute bg-red-500 rounded-full flex items-center justify-center ${
            compact ? '-top-1 -right-1 w-3 h-3' : '-top-1 -right-1 w-4 h-4'
          }`}>
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}

        {compact ? (
          // Compact card layout to match stats cards
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xl">🔥</span>
              <span className="text-2xl font-bold text-orange-300">{streakData.currentStreak}</span>
            </div>
            <div className="text-sm text-gray-300">Daily Streak</div>
            {hasUnclaimedReward && (
              <div className="text-xs text-yellow-400 font-semibold mt-1 animate-bounce">
                🎁 Recompensa!
              </div>
            )}
          </div>
        ) : (
          // Original header layout
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-2xl">🔥</span>
              <div className="text-left">
                <div className="text-white font-bold text-lg">
                  {streakData.currentStreak}
                </div>
                <div className="text-gray-300 text-xs">
                  dias
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <div className="text-white text-sm font-medium">
                Streak
              </div>
              <div className="text-xs">
                {hasUnclaimedReward ? (
                  <span className="text-yellow-400 font-semibold animate-bounce">
                    🎁 Nova recompensa!
                  </span>
                ) : streakData.hasClaimedToday ? (
                  <span className="text-green-400">✅ Coletado hoje</span>
                ) : (
                  <span className="text-gray-400">Toque para ver</span>
                )}
              </div>
            </div>
          </div>
        )}
      </button>

      <DailyRewardsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onRewardClaimed={handleRewardClaimed}
      />
    </>
  )
}