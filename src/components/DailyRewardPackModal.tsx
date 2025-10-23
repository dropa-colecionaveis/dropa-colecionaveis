'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Pack {
  id: string
  name: string
  type: string
  description: string
  price: number
  customType?: {
    displayName: string
    emoji: string
    color: string
  }
}

interface FreePackGrant {
  id: string
  pack: Pack
  grantedAt: string
  claimed: boolean
  source: string
}

interface Item {
  id: string
  name: string
  description: string
  rarity: string
  value: number
  imageUrl: string
}

interface DailyRewardPackModalProps {
  isOpen: boolean
  onClose: () => void
  onItemReceived?: () => void
}

export default function DailyRewardPackModal({ isOpen, onClose, onItemReceived }: DailyRewardPackModalProps) {
  const [step, setStep] = useState<'show-pack' | 'opening' | 'result'>('show-pack')
  const [loading, setLoading] = useState(false)
  const [dailyPackGrants, setDailyPackGrants] = useState<FreePackGrant[]>([])
  const [currentPackIndex, setCurrentPackIndex] = useState(0)
  const [wonItem, setWonItem] = useState<Item | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      checkDailyPacks()
    }
  }, [isOpen])

  const checkDailyPacks = async () => {
    try {
      const response = await fetch('/api/daily-rewards/check-packs')
      if (response.ok) {
        const data = await response.json()
        setDailyPackGrants(data.unclaimedDailyPacks || [])
        setCurrentPackIndex(0)
        setStep('show-pack')
      }
    } catch (error) {
      console.error('Error checking daily packs:', error)
    }
  }

  const getPackDisplayInfo = (pack: Pack) => {
    if (pack.customType) {
      return {
        emoji: pack.customType.emoji,
        displayName: pack.customType.displayName,
        color: pack.customType.color
      }
    }
    
    // Fallback para tipos antigos
    switch (pack.type) {
      case 'BRONZE': return { emoji: '🥉', displayName: 'Bronze', color: '#CD7F32' }
      case 'SILVER': return { emoji: '🥈', displayName: 'Prata', color: '#C0C0C0' }
      case 'GOLD': return { emoji: '🥇', displayName: 'Ouro', color: '#FFD700' }
      case 'PLATINUM': return { emoji: '💎', displayName: 'Platina', color: '#E5E4E2' }
      case 'DIAMOND': return { emoji: '💠', displayName: 'Diamante', color: '#B9F2FF' }
      default: return { emoji: '📦', displayName: 'Pack', color: '#6B7280' }
    }
  }

  const openPack = async () => {
    if (!dailyPackGrants[currentPackIndex]) return

    setLoading(true)
    setStep('opening')

    try {
      // Animação de 3 segundos antes de fazer a requisição
      setTimeout(async () => {
        const response = await fetch('/api/free-pack/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freePackGrantId: dailyPackGrants[currentPackIndex].id
          })
        })

        if (response.ok) {
          const result = await response.json()
          setWonItem(result.item)
          setStep('result')
          if (onItemReceived) {
            onItemReceived()
          }
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao abrir o pack. Tente novamente.')
          setStep('show-pack')
        }
        setLoading(false)
      }, 3000)
    } catch (error) {
      console.error('Error opening pack:', error)
      alert('Erro ao abrir o pack. Tente novamente.')
      setStep('show-pack')
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentPackIndex < dailyPackGrants.length - 1) {
      setCurrentPackIndex(currentPackIndex + 1)
      setStep('show-pack')
      setWonItem(null)
    } else {
      onClose()
    }
  }

  const handleClose = () => {
    setStep('show-pack')
    setCurrentPackIndex(0)
    setWonItem(null)
    onClose()
  }

  if (!isOpen || dailyPackGrants.length === 0) return null

  const currentPack = dailyPackGrants[currentPackIndex]
  const packInfo = getPackDisplayInfo(currentPack.pack)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 text-center relative border border-gray-700">
        
        {step === 'show-pack' && (
          <>
            <div className="text-4xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Você ganhou um Pack!
            </h2>
            <p className="text-gray-300 mb-6">
              Recompensa diária - {packInfo.displayName}
            </p>
            
            <div 
              className="pack-preview mx-auto mb-6 w-32 h-40 rounded-lg flex items-center justify-center text-6xl border-2"
              style={{ 
                borderColor: packInfo.color,
                background: `linear-gradient(135deg, ${packInfo.color}20, ${packInfo.color}10)`
              }}
            >
              {packInfo.emoji}
            </div>

            <p className="text-gray-400 mb-6 text-sm">
              {currentPack.pack.name}
            </p>

            <button
              onClick={openPack}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Abrindo...' : 'Abrir Pack'}
            </button>

            {dailyPackGrants.length > 1 && (
              <p className="text-gray-500 text-sm mt-4">
                Pack {currentPackIndex + 1} de {dailyPackGrants.length}
              </p>
            )}
          </>
        )}

        {step === 'opening' && (
          <div className="py-8">
            <div className="text-6xl mb-4 animate-bounce">{packInfo.emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-4">Abrindo pack...</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>
        )}

        {step === 'result' && wonItem && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-4">Parabéns!</h2>
            <p className="text-gray-300 mb-6">Você ganhou:</p>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
              <img
                src={wonItem.imageUrl || '/placeholder-item.svg'}
                alt={wonItem.name}
                className="w-24 h-24 mx-auto mb-3 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallbackDiv = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                  if (fallbackDiv) fallbackDiv.style.display = 'flex';
                }}
              />
              <div className="fallback-icon w-24 h-24 mx-auto mb-3 rounded-lg bg-gray-700 border border-gray-600 hidden items-center justify-center text-3xl">
                🏆
              </div>
              <h3 className="font-bold text-lg text-white mb-1">{wonItem.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{wonItem.description}</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                wonItem.rarity === 'LENDARIO' ? 'bg-yellow-500/20 text-yellow-400' :
                wonItem.rarity === 'EPICO' ? 'bg-purple-500/20 text-purple-400' :
                wonItem.rarity === 'RARO' ? 'bg-blue-500/20 text-blue-400' :
                wonItem.rarity === 'INCOMUM' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {wonItem.rarity}
              </span>
            </div>

            <button
              onClick={currentPackIndex < dailyPackGrants.length - 1 ? handleNext : handleClose}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {currentPackIndex < dailyPackGrants.length - 1 ? 'Próximo Pack' : 'Continuar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}