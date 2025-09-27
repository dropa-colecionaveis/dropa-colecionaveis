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
  bonusCredits: number
  bonusTier: string
  isCurrent: boolean
  canClaim: boolean
  claimed?: boolean
  claimedAt?: string
}

interface DailyRewardsData {
  currentStreak: number
  cycleDay: number
  bonusCredits: number
  bonusTier: string
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
  const [autoCloseTimeout, setAutoCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showAlreadyClaimedMessage, setShowAlreadyClaimedMessage] = useState(false)
  const router = useRouter()

  // Handle ESC key press and cleanup
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showClaimAnimation) {
          closeClaimAnimation()
        } else if (showAlreadyClaimedMessage) {
          setShowAlreadyClaimedMessage(false)
        } else {
          onClose()
        }
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
      // Limpar timeout ao desmontar componente
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout)
      }
    }
  }, [isOpen, onClose, showClaimAnimation, showAlreadyClaimedMessage, autoCloseTimeout])

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
        
        // Atualizar dados após claim (aumentado para 8 segundos)
        const timeout = setTimeout(() => {
          closeClaimAnimation()
        }, 8000)
        setAutoCloseTimeout(timeout)

      } else if (response.status === 409) {
        // Recompensa já foi coletada hoje
        const error = await response.json()
        setShowAlreadyClaimedMessage(true)
        
        // Atualizar dados para refletir o estado correto
        fetchRewardsData()
        
        // Notificar o componente pai (StreakIndicator) para atualizar também
        onRewardClaimed?.(null)
        
        // Fechar mensagem automaticamente após 4 segundos
        setTimeout(() => {
          setShowAlreadyClaimedMessage(false)
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

  const formatBonusText = (bonusCredits: number, bonusTier: string) => {
    if (bonusCredits <= 0) return ''
    return `+${bonusCredits} crédito${bonusCredits > 1 ? 's' : ''} (${bonusTier})`
  }

  const closeClaimAnimation = () => {
    if (autoCloseTimeout) {
      clearTimeout(autoCloseTimeout)
      setAutoCloseTimeout(null)
    }
    setShowClaimAnimation(false)
    fetchRewardsData()
    onRewardClaimed?.(claimedReward)
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 mx-2 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-2">
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                🔥 Recompensas Diárias
              </h2>
              {loading ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                  <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-white/10 rounded w-24 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                </div>
              ) : rewardsData && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                  <div className="text-sm text-gray-300">
                    Streak atual: <span className="font-bold text-yellow-400">{rewardsData.currentStreak}</span> dias
                  </div>
                  {rewardsData.bonusCredits > 0 && (
                    <div className="text-sm text-green-400 font-semibold">
                      {formatBonusText(rewardsData.bonusCredits, rewardsData.bonusTier)}
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
          <div className="p-4 sm:p-6">
            {/* Skeleton Loading */}
            
            {/* Today's Reward Skeleton */}
            <div className="mb-6 sm:mb-8">
              <div className="h-5 sm:h-6 bg-white/10 rounded-md w-64 mb-3 sm:mb-4 animate-pulse"></div>
              
              <div className="p-4 sm:p-6 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div 
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full animate-pulse"
                      style={{ animationDelay: '100ms' }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="h-4 sm:h-5 bg-white/20 rounded-md w-32 mb-2 animate-pulse"
                        style={{ animationDelay: '200ms' }}
                      ></div>
                      <div 
                        className="h-3 sm:h-4 bg-white/10 rounded-md w-48 animate-pulse"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div 
                      className="h-10 sm:h-12 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-lg w-32 sm:w-40 animate-pulse"
                      style={{ animationDelay: '400ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Rewards Skeleton */}
            <div>
              <div className="h-5 sm:h-6 bg-white/10 rounded-md w-72 mb-3 sm:mb-4 animate-pulse"></div>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {[...Array(7)].map((_, index) => (
                  <div
                    key={index}
                    className={`p-1.5 sm:p-3 rounded-lg min-h-[80px] sm:min-h-[100px] flex flex-col justify-between border ${
                      index === 2 
                        ? 'border-yellow-400/30 bg-yellow-400/10' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div 
                      className="h-3 bg-white/20 rounded w-8 mx-auto mb-1 animate-pulse"
                      style={{ animationDelay: `${index * 150}ms` }}
                    ></div>
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full mx-auto mb-1 sm:mb-2 animate-pulse"
                      style={{ animationDelay: `${index * 200}ms` }}
                    ></div>
                    <div 
                      className="h-2 sm:h-3 bg-white/10 rounded w-6 mx-auto animate-pulse"
                      style={{ animationDelay: `${index * 100}ms` }}
                    ></div>
                  </div>
                ))}
              </div>
              
              <div className="h-3 bg-white/10 rounded-md w-full mt-3 animate-pulse"></div>
            </div>

          </div>
        ) : rewardsData ? (
          <div className="p-4 sm:p-6">
            
            {/* Today's Reward */}
            {rewardsData.todayReward && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                  🎯 Recompensa de Hoje (Dia {rewardsData.cycleDay})
                </h3>
                
                <div className={`p-4 sm:p-6 rounded-lg border-2 ${
                  rewardsData.hasClaimedToday 
                    ? 'border-green-500/30 bg-green-500/10' 
                    : 'border-yellow-500/50 bg-yellow-500/20'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      <div className="text-3xl sm:text-4xl flex-shrink-0">
                        {getRewardIcon(rewardsData.todayReward)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm sm:text-base">
                          {getRewardDescription(rewardsData.todayReward)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300 break-words">
                          Continue sua sequência de login!
                        </div>
                        {rewardsData.bonusCredits > 0 && rewardsData.todayReward.rewardType === 'CREDITS' && (
                          <div className="text-xs sm:text-sm text-green-400 mt-1">
                            Valor original: {rewardsData.todayReward.rewardValue} 
                            → Com bônus: {rewardsData.todayReward.adjustedValue}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {rewardsData.hasClaimedToday ? (
                        <div className="text-center">
                          <div className="text-green-400 font-semibold text-sm sm:text-base">✅ Coletado!</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(rewardsData.todayReward.claimedAt!).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleClaimReward}
                          disabled={claiming}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 text-sm sm:text-base"
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
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                📅 Próximas Recompensas (Ciclo de 7 Dias)
              </h3>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {rewardsData.upcomingRewards.map((reward, index) => (
                  <div
                    key={reward.id}
                    className={`p-1.5 sm:p-3 rounded-lg text-center min-h-[80px] sm:min-h-[100px] flex flex-col justify-between ${
                      reward.isCurrent
                        ? 'border-2 border-yellow-400 bg-yellow-400/20'
                        : 'border border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="text-[10px] sm:text-xs text-gray-300 mb-1">
                      Dia {reward.day}
                    </div>
                    <div className="text-lg sm:text-2xl mb-1 sm:mb-2 flex-shrink-0">
                      {getRewardIcon(reward)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-white font-medium leading-tight">
                      {reward.rewardType === 'CREDITS' ? (
                        `${reward.adjustedValue}`
                      ) : reward.rewardType === 'PACK' ? (
                        `${reward.rewardValue}x`
                      ) : (
                        'Item'
                      )}
                    </div>
                    {reward.isCurrent && (
                      <div className="text-[8px] sm:text-xs text-yellow-400 font-bold mt-0.5 sm:mt-1">
                        HOJE
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-[10px] sm:text-xs text-gray-400 text-center mt-3 px-2">
                💡 Mantenha seu streak para bônus fixos: 8+ dias (+1 crédito), 15+ dias (+2 créditos), 31+ dias (+3 créditos)
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
            className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] rounded-xl"
          >
            {/* Botão X para fechar */}
            <button
              onClick={closeClaimAnimation}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl z-[101] bg-black/30 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/50"
            >
              ✕
            </button>
            
            <div className="text-center transform transition-all duration-700 scale-100 animate-bounce cursor-pointer"
                 onClick={closeClaimAnimation}
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
                  
                  {claimedReward.bonusCredits > 0 && claimedReward.type === 'CREDITS' && (
                    <div className="bg-green-500/20 rounded-lg p-2 border border-green-400/30">
                      <div className="text-green-300 text-lg font-semibold flex items-center justify-center gap-2">
                        <span className="text-xl">🚀</span>
                        <span>{formatBonusText(claimedReward.bonusCredits, claimedReward.bonusTier)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action hint */}
                <div className="text-gray-300 text-sm mt-4 opacity-75">
                  Clique em qualquer lugar ou no ✕ para continuar
                </div>
                <div className="text-gray-400 text-xs mt-2 opacity-60">
                  Fechará automaticamente em alguns segundos...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Already Claimed Message */}
        {showAlreadyClaimedMessage && (
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] rounded-xl"
          >
            <div className="text-center transform transition-all duration-500 scale-100">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30 mx-4">
                <div className="text-6xl mb-4 animate-bounce">✅</div>
                
                <div className="text-white text-2xl font-bold mb-3">
                  Recompensa já coletada!
                </div>
                
                <div className="text-blue-200 text-lg mb-4">
                  Você já coletou esta recompensa hoje.
                </div>
                
                <div className="text-gray-300 text-sm">
                  Sua recompensa já está disponível no seu inventário!
                </div>
                
                <button
                  onClick={() => setShowAlreadyClaimedMessage(false)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Entendi
                </button>
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