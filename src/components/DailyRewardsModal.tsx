'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'

interface PackType {
  id: string
  name: string
  displayName: string
  emoji: string
  color: string
}

interface DailyReward {
  id: string
  day: number
  rewardType: 'CREDITS' | 'PACK' | 'ITEMS'
  rewardValue: number
  adjustedValue: number
  description: string
  packType?: PackType
  bonusMultiplier: number
  isCurrent: boolean
  canClaim: boolean
  claimed?: boolean
  claimedAt?: string
}

interface DailyRewardsData {
  currentStreak: number
  cycleDay: number
  bonusMultiplier: number
  todayReward: DailyReward | null
  upcomingRewards: DailyReward[]
  hasClaimedToday: boolean
}

interface DailyRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  onRewardClaimed?: (reward: any) => void
}

export default function DailyRewardsModal({ isOpen, onClose, onRewardClaimed }: DailyRewardsModalProps) {
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [rewardsData, setRewardsData] = useState<DailyRewardsData | null>(null)
  const [showClaimAnimation, setShowClaimAnimation] = useState(false)
  const [claimedReward, setClaimedReward] = useState<any>(null)
  const router = useRouter()

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      fetchRewardsData()
    }
  }, [isOpen])

  const fetchRewardsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/daily-rewards')
      
      if (response.ok) {
        const data = await response.json()
        setRewardsData(data)
      } else {
        console.error('Failed to fetch rewards data')
      }
    } catch (error) {
      console.error('Error fetching rewards data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async () => {
    if (!rewardsData?.todayReward?.canClaim) return

    try {
      setClaiming(true)
      const response = await fetch('/api/user/daily-rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setClaimedReward(result.reward)
        setShowClaimAnimation(true)
        
        // Atualizar dados após claim
        setTimeout(() => {
          fetchRewardsData()
          setShowClaimAnimation(false)
          onRewardClaimed?.(result.reward)
        }, 4000)

      } else {
        const error = await response.json()
        alert(`Erro ao reivindicar recompensa: ${error.error}`)
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
      alert('Erro ao reivindicar recompensa')
    } finally {
      setClaiming(false)
    }
  }

  const getRewardIcon = (reward: DailyReward) => {
    if (reward.rewardType === 'CREDITS') {
      return '💰'
    } else if (reward.rewardType === 'PACK') {
      return reward.packType?.emoji || '📦'
    } else {
      return '🎁'
    }
  }

  const getRewardDescription = (reward: DailyReward) => {
    if (reward.rewardType === 'CREDITS') {
      return `${reward.adjustedValue} Créditos`
    } else if (reward.rewardType === 'PACK') {
      return `${reward.rewardValue}x ${reward.packType?.displayName || 'Pacote'}`
    } else {
      return reward.description
    }
  }

  const formatBonusText = (bonusMultiplier: number) => {
    if (bonusMultiplier <= 1) return ''
    const bonus = Math.round((bonusMultiplier - 1) * 100)
    return `+${bonus}% bonus`
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🔥 Recompensas Diárias
              </h2>
              {rewardsData && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-sm text-gray-300">
                    Streak atual: <span className="font-bold text-yellow-400">{rewardsData.currentStreak}</span> dias
                  </div>
                  {rewardsData.bonusMultiplier > 1 && (
                    <div className="text-sm text-green-400 font-semibold">
                      {formatBonusText(rewardsData.bonusMultiplier)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ❌
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="text-white">Carregando recompensas...</div>
          </div>
        ) : rewardsData ? (
          <div className="p-6">
            
            {/* Today's Reward */}
            {rewardsData.todayReward && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  🎯 Recompensa de Hoje (Dia {rewardsData.cycleDay})
                </h3>
                
                <div className={`p-6 rounded-lg border-2 ${
                  rewardsData.hasClaimedToday 
                    ? 'border-green-500/30 bg-green-500/10' 
                    : 'border-yellow-500/50 bg-yellow-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {getRewardIcon(rewardsData.todayReward)}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {getRewardDescription(rewardsData.todayReward)}
                        </div>
                        <div className="text-sm text-gray-300">
                          {rewardsData.todayReward.description}
                        </div>
                        {rewardsData.bonusMultiplier > 1 && (
                          <div className="text-sm text-green-400">
                            Valor original: {rewardsData.todayReward.rewardValue} 
                            → Com bonus: {rewardsData.todayReward.adjustedValue}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {rewardsData.hasClaimedToday ? (
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">✅ Coletado!</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(rewardsData.todayReward.claimedAt!).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleClaimReward}
                          disabled={claiming}
                          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                        >
                          {claiming ? '⏳ Coletando...' : '🎁 Coletar Agora!'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Rewards Preview */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                📅 Próximas Recompensas (Ciclo de 7 Dias)
              </h3>
              
              <div className="grid grid-cols-7 gap-2">
                {rewardsData.upcomingRewards.map((reward, index) => (
                  <div
                    key={reward.id}
                    className={`p-3 rounded-lg text-center ${
                      reward.isCurrent
                        ? 'border-2 border-yellow-400 bg-yellow-400/20'
                        : 'border border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="text-xs text-gray-300 mb-1">Dia {reward.day}</div>
                    <div className="text-2xl mb-2">{getRewardIcon(reward)}</div>
                    <div className="text-xs text-white font-medium">
                      {reward.rewardType === 'CREDITS' ? (
                        `${reward.adjustedValue}`
                      ) : reward.rewardType === 'PACK' ? (
                        `${reward.rewardValue}x`
                      ) : (
                        'Item'
                      )}
                    </div>
                    {reward.isCurrent && (
                      <div className="text-xs text-yellow-400 font-bold mt-1">HOJE</div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-gray-400 text-center mt-3">
                💡 Mantenha seu streak para multiplicadores de bonus: 8+ dias (+10%), 15+ dias (+20%), 31+ dias (+30%)
              </div>
            </div>

          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-red-400">Erro ao carregar recompensas</div>
          </div>
        )}

        {/* Claim Animation Overlay */}
        {showClaimAnimation && claimedReward && (
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] rounded-xl cursor-pointer"
            onClick={() => setShowClaimAnimation(false)}
          >
            <div className="text-center transform transition-all duration-700 scale-100 animate-bounce"
                 style={{ 
                   animation: 'bounceIn 0.7s ease-out, floating 2s ease-in-out infinite 0.7s' 
                 }}>
              <style jsx>{`
                @keyframes bounceIn {
                  0% { transform: scale(0.3) translateY(50px); opacity: 0; }
                  30% { transform: scale(1.1) translateY(-10px); opacity: 0.8; }
                  60% { transform: scale(0.95) translateY(5px); opacity: 1; }
                  100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes floating {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
              `}</style>
              {/* Celebration Icons */}
              <div className="relative mb-6">
                <div className="text-8xl animate-bounce">🎉</div>
                <div className="absolute -top-2 -left-4 text-4xl animate-pulse">✨</div>
                <div className="absolute -top-2 -right-4 text-4xl animate-pulse delay-300">⭐</div>
                <div className="absolute -bottom-2 left-8 text-3xl animate-pulse delay-150">🎊</div>
                <div className="absolute -bottom-2 right-8 text-3xl animate-pulse delay-500">💫</div>
              </div>
              
              {/* Success Message */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30 mb-4 mx-4">
                <div className="text-white text-3xl font-black mb-3 drop-shadow-lg">
                  🎁 Recompensa Coletada!
                </div>
                
                {/* Reward Details */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30">
                  <div className="text-yellow-300 text-2xl font-bold mb-2">
                    {claimedReward.type === 'CREDITS' ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">💰</span>
                        <span>+{claimedReward.value} Créditos</span>
                      </div>
                    ) : claimedReward.type === 'PACK' ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">📦</span>
                        <span>{claimedReward.description}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">🎁</span>
                        <span>{claimedReward.description}</span>
                      </div>
                    )}
                  </div>
                  
                  {claimedReward.bonusMultiplier > 1 && (
                    <div className="bg-green-500/20 rounded-lg p-2 border border-green-400/30">
                      <div className="text-green-300 text-lg font-semibold flex items-center justify-center gap-2">
                        <span className="text-xl">🚀</span>
                        <span>{formatBonusText(claimedReward.bonusMultiplier)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action hint */}
                <div className="text-gray-300 text-sm mt-4 opacity-75">
                  Clique em qualquer lugar para continuar
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}