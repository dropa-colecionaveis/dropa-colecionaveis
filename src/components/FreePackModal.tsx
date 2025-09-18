'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Pack {
  id: string
  name: string
  type: string
  description: string
  price: number
}

interface FreePackGrant {
  id: string
  pack: Pack
  grantedAt: string
  claimed: boolean
}

interface Item {
  id: string
  name: string
  description: string
  rarity: string
  value: number
  imageUrl: string
}

interface FreePackModalProps {
  isOpen: boolean
  onClose: () => void
  onItemReceived?: () => void // Callback para refresh do dashboard
}

export default function FreePackModal({ isOpen, onClose, onItemReceived }: FreePackModalProps) {
  const [step, setStep] = useState<'generate' | 'show-pack' | 'opening' | 'result'>('generate')
  const [loading, setLoading] = useState(false)
  const [freePackGrant, setFreePackGrant] = useState<FreePackGrant | null>(null)
  const [wonItem, setWonItem] = useState<Item | null>(null)
  const router = useRouter()

  const getPackTypeEmoji = (type: string) => {
    switch (type) {
      case 'BRONZE': return '🥉'
      case 'SILVER': return '🥈'
      case 'GOLD': return '🥇'
      case 'PLATINUM': return '💎'
      case 'DIAMOND': return '💠'
      default: return '📦'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
      case 'INCOMUM': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'RARO': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'EPICO': return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
      case 'LENDARIO': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'Comum'
      case 'INCOMUM': return 'Incomum'
      case 'RARO': return 'Raro'
      case 'EPICO': return 'Épico'
      case 'LENDARIO': return 'Lendário'
      default: return rarity
    }
  }

  const generateFreePack = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/free-pack/generate', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setFreePackGrant(data.freePack)
        setStep('show-pack')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao gerar pacote grátis')
      }
    } catch (error) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Check for existing unclaimed free pack when modal opens
  useEffect(() => {
    const checkForExistingFreePack = async () => {
      try {
        const response = await fetch('/api/free-pack/check')
        if (response.ok) {
          const data = await response.json()
          if (data.unclaimedFreePack) {
            setFreePackGrant(data.unclaimedFreePack)
            setStep('show-pack')
          }
        }
      } catch (error) {
        console.error('Error checking free pack:', error)
      }
    }

    if (isOpen && step === 'generate') {
      checkForExistingFreePack()
    }
  }, [isOpen, step])

  const claimFreePack = async () => {
    if (!freePackGrant) return
    
    setStep('opening')
    setLoading(true)

    try {
      // Animação mais rápida - apenas 800ms para UX melhor
      setTimeout(async () => {
        const response = await fetch('/api/free-pack/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            freePackGrantId: freePackGrant.id
          })
        })

        if (response.ok) {
          const data = await response.json()
          setWonItem(data.item)
          setStep('result')
          // Notificar o dashboard para atualizar
          if (onItemReceived) {
            onItemReceived()
          }
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao abrir pacote')
        }
        setLoading(false)
      }, 800)
    } catch (error) {
      alert('Erro inesperado')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('generate')
    setFreePackGrant(null)
    setWonItem(null)
    onClose()
  }

  const goToInventory = () => {
    handleClose()
    router.push('/inventory')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-8 max-w-xs sm:max-w-lg lg:max-w-2xl w-full border border-white/20 shadow-2xl relative overflow-hidden my-4 min-h-0 max-h-[95vh] overflow-y-auto">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
        
        <div className="relative z-10">
          {/* Step 1: Generate Free Pack */}
          {step === 'generate' && (
            <div className="text-center">
              <div className="text-4xl sm:text-6xl lg:text-8xl mb-4 sm:mb-6 animate-bounce">🎁</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                🎉 Bem-vindo! 🎉
              </h2>
              <p className="text-sm sm:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 leading-relaxed">
                Como novo membro da nossa comunidade, você tem direito a um <span className="text-green-400 font-bold">pacote grátis</span>!
                <br />
                Clique no botão abaixo para descobrir qual pacote épico você ganhou!
              </p>
              
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl p-6 mb-8 border border-yellow-400/30">
                <h3 className="text-base sm:text-lg font-bold text-yellow-300 mb-2 sm:mb-3">🎲 Como funciona?</h3>
                <div className="text-xs sm:text-sm text-yellow-200 space-y-1 sm:space-y-2">
                  <p>• <span className="font-semibold">55%</span> de chance de ganhar Pacote Bronze 🥉</p>
                  <p>• <span className="font-semibold">30%</span> de chance de ganhar Pacote Silver 🥈</p>
                  <p>• <span className="font-semibold">12%</span> de chance de ganhar Pacote Gold 🥇</p>
                  <p>• <span className="font-semibold">2.5%</span> de chance de ganhar Pacote Platinum 💎</p>
                  <p>• <span className="font-semibold">0.5%</span> de chance de ganhar Pacote Diamond 💠</p>
                </div>
              </div>

              <button
                onClick={generateFreePack}
                disabled={loading}
                className="group relative w-full overflow-hidden px-4 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white text-lg sm:text-xl lg:text-2xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-xl hover:shadow-2xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sorteando seu pacote...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl group-hover:animate-spin">🎰</span>
                      <span>Pegar Meu Pacote Grátis!</span>
                      <span className="text-3xl group-hover:animate-spin">🎰</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          )}

          {/* Step 2: Show Pack Won */}
          {step === 'show-pack' && freePackGrant && (
            <div className="text-center">
              <div className="text-4xl sm:text-6xl lg:text-8xl mb-4 sm:mb-6 animate-bounce">🎊</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                🏆 PARABÉNS! 🏆
              </h2>
              
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-white/20 transform hover:scale-[1.02] transition-all duration-300">
                <div className="text-5xl sm:text-7xl lg:text-9xl mb-4 sm:mb-6 animate-pulse">
                  {getPackTypeEmoji(freePackGrant.pack.type)}
                </div>
                
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                  Você ganhou um {freePackGrant.pack.name}!
                </h3>
                
                <p className="text-sm sm:text-base lg:text-lg text-gray-200 mb-4 sm:mb-6">
                  {freePackGrant.pack.description}
                </p>
                
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-3 sm:p-4 border border-green-400/30">
                  <div className="text-lg sm:text-xl lg:text-2xl text-green-300 font-bold">
                    💰 Valor: {freePackGrant.pack.price} créditos
                  </div>
                  <div className="text-xs sm:text-sm text-green-200">
                    (Você ganhou este pacote gratuitamente!)
                  </div>
                </div>
              </div>

              <button
                onClick={claimFreePack}
                className="group relative w-full overflow-hidden px-4 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg sm:text-xl lg:text-2xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-3xl group-hover:animate-pulse">⚡</span>
                  <span>Abrir Pacote Épico!</span>
                  <span className="text-3xl group-hover:animate-pulse">⚡</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          )}

          {/* Step 3: Opening Animation */}
          {step === 'opening' && freePackGrant && (
            <div className="text-center">
              <div className="text-5xl sm:text-7xl lg:text-9xl mb-6 sm:mb-8 animate-pulse transform hover:scale-110 transition-transform duration-500">
                {getPackTypeEmoji(freePackGrant.pack.type)}
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                ✨ Abrindo {freePackGrant.pack.name}... ✨
              </h2>
              
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto border-4 border-transparent bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-spin">
                  <div className="w-full h-full border-4 border-white border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-lg animate-pulse"></div>
              </div>
              
              <div className="space-y-3">
                <p className="text-lg sm:text-xl text-purple-300 font-semibold animate-pulse">
                  🎯 Preparando sua surpresa épica...
                </p>
                <div className="flex justify-center space-x-1">
                  {['⭐', '💎', '🎲', '🏆', '✨'].map((emoji, i) => (
                    <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && wonItem && (
            <div className="text-center">
              <div className="text-4xl sm:text-6xl lg:text-8xl mb-4 sm:mb-6 animate-bounce">🎉</div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                🏆 ITEM ÉPICO OBTIDO! 🏆
              </h2>
              
              <div className={`bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-8 border-2 shadow-2xl transform hover:scale-[1.02] transition-all duration-500 ${getRarityColor(wonItem.rarity)} relative overflow-hidden mb-6 sm:mb-8`}>
                {/* Item glow effect */}
                <div className={`absolute -inset-4 ${getRarityColor(wonItem.rarity)} rounded-3xl blur-2xl opacity-40 animate-pulse`}></div>
                
                <div className="relative z-10">
                  <div className={`w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto rounded-2xl mb-4 sm:mb-6 flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl shadow-2xl ${getRarityColor(wonItem.rarity)} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="relative z-10">🏆</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                  
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 ${getRarityColor(wonItem.rarity).split(' ')[0]} drop-shadow-lg`}>
                    {wonItem.name}
                  </h3>
                  
                  <p className="text-gray-200 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg font-medium bg-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-sm border border-white/20">
                    {wonItem.description}
                  </p>
                  
                  <div className={`inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-base sm:text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 ${getRarityColor(wonItem.rarity)} border-2 border-white/30 backdrop-blur-sm mb-4 sm:mb-6`}>
                    ⭐ {getRarityName(wonItem.rarity)} ⭐
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-green-400/30">
                    <div className="text-lg sm:text-xl lg:text-2xl text-green-300 font-bold flex items-center justify-center space-x-2">
                      <span className="text-xl sm:text-2xl lg:text-3xl animate-pulse">💰</span>
                      <span>Valor: {wonItem.value} créditos</span>
                      <span className="text-xl sm:text-2xl lg:text-3xl animate-pulse">💰</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={goToInventory}
                  className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-xl group-hover:animate-pulse">🎒</span>
                    <span>Ver no Inventário</span>
                    <span className="text-xl group-hover:animate-pulse">🎒</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
                
                <button
                  onClick={handleClose}
                  className="block w-full text-gray-300 hover:text-white transition duration-300 text-base sm:text-lg font-medium bg-white/10 rounded-2xl py-2 sm:py-3 px-4 sm:px-6 backdrop-blur-sm hover:bg-white/20"
                >
                  Continuar Explorando
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}