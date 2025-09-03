'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getRarityName } from '@/lib/rarity-system'

interface Pack {
  id: string
  name: string
  description: string
  price: number
  type: string
}

interface Item {
  id: string
  name: string
  description: string
  rarity: string
  value: number
  imageUrl: string
}

interface OpenResult {
  item: Item
  newBalance: number
  pack: Pack
}

interface MultipleOpenResult {
  items: Item[]
  newBalance: number
  pack: Pack
  summary: {
    totalItems: number
    totalValue: number
    rarityCounts: Record<string, number>
  }
}

export default function OpenPack() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const packId = params.packId as string

  const [pack, setPack] = useState<Pack | null>(null)
  const [openResult, setOpenResult] = useState<OpenResult | null>(null)
  const [multipleOpenResult, setMultipleOpenResult] = useState<MultipleOpenResult | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userCredits, setUserCredits] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [displayMode, setDisplayMode] = useState<'instant' | 'suspense'>('instant')
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [autoProgress, setAutoProgress] = useState(false)
  
  // Refs for scroll control
  const resultSectionRef = useRef<HTMLDivElement>(null)

  // Function to scroll to result section smoothly
  const scrollToResult = () => {
    setTimeout(() => {
      if (resultSectionRef.current) {
        resultSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        })
      }
    }, 100) // Small delay to ensure element is rendered
  }

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && packId) {
      fetchPackDetails()
      fetchUserProfile()
      // Ensure auto-progress is disabled on page load/reload
      setAutoProgress(false)
    }
  }, [status, router, packId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-progress in suspense mode (only when explicitly enabled by user)
  useEffect(() => {
    if (autoProgress && displayMode === 'suspense' && multipleOpenResult && currentItemIndex < multipleOpenResult.items.length - 1) {
      const timer = setTimeout(() => {
        setCurrentItemIndex(currentItemIndex + 1)
        scrollToResult()
      }, 600) // Ultra fast 0.6 seconds per item
      
      return () => clearTimeout(timer)
    } else if (autoProgress && multipleOpenResult?.items && currentItemIndex >= multipleOpenResult.items.length - 1) {
      // Auto-stop when reaching the last item
      setAutoProgress(false)
    }
  }, [autoProgress, displayMode, multipleOpenResult, currentItemIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPackDetails = async () => {
    try {
      const response = await fetch('/api/packs')
      if (response.ok) {
        const packs = await response.json()
        const selectedPack = packs.find((p: Pack) => p.id === packId)
        if (selectedPack) {
          setPack(selectedPack)
        } else {
          router.push('/packs')
        }
      }
    } catch (error) {
      console.error('Error fetching pack:', error)
      router.push('/packs')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.credits)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const openPack = async () => {
    if (!pack) return

    setIsOpening(true)

    try {
      if (quantity === 1) {
        // Single pack opening
        const response = await fetch('/api/packs/open', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packId: pack.id }),
        })

        if (response.ok) {
          const result = await response.json()
          setOpenResult(result)
          
          // Show pack opening animation
          setTimeout(() => {
            setIsOpening(false)
            setShowResult(true)
            scrollToResult() // Scroll to result after animation
          }, 800) // Fast animation for better UX
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to open pack')
          setIsOpening(false)
        }
      } else {
        // Multiple pack opening
        const response = await fetch('/api/packs/open-multiple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packId: pack.id, quantity }),
        })

        if (response.ok) {
          const result = await response.json()
          setMultipleOpenResult(result)
          
          // Show pack opening animation
          setTimeout(() => {
            setIsOpening(false)
            setShowResult(true)
            // Reset to first item for suspense mode
            setCurrentItemIndex(0)
            // Note: Auto-progress is disabled by default - user must click to reveal each item
            scrollToResult() // Scroll to result after animation
          }, 800) // Fast animation for better UX
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to open packs')
          setIsOpening(false)
        }
      }
    } catch (error) {
      console.error('Error opening pack:', error)
      alert('Something went wrong')
      setIsOpening(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM': return 'text-gray-400 bg-gray-500/20'
      case 'INCOMUM': return 'text-green-400 bg-green-500/20'
      case 'RARO': return 'text-blue-400 bg-blue-500/20'
      case 'EPICO': return 'text-purple-400 bg-purple-500/20'
      case 'LENDARIO': return 'text-yellow-400 bg-yellow-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getTotalCost = () => quantity * pack!.price
  const hasEnoughCredits = () => userCredits >= getTotalCost()
  const getMaxQuantity = () => Math.floor(userCredits / pack!.price)

  const adjustQuantity = (delta: number) => {
    const newQuantity = quantity + delta
    const maxQuantity = getMaxQuantity()
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity)
    }
  }

  const showNextItem = () => {
    if (multipleOpenResult && currentItemIndex < multipleOpenResult.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
      scrollToResult() // Scroll to show the new item
    }
  }

  const showAllItems = () => {
    setDisplayMode('instant')
    setAutoProgress(false) // Stop auto-progress when showing all
    scrollToResult() // Scroll to show all items
  }

  const startAutoProgress = () => {
    setAutoProgress(true)
  }

  const stopAutoProgress = () => {
    setAutoProgress(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Pacote não encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-30"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl border-b border-purple-500/30 shadow-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard" className="group">
                <div className="flex items-center space-x-3 group-hover:scale-105 transition-all duration-300">
                  <img 
                    src="/Dropa!.png" 
                    alt="Dropa!" 
                    className="h-8 w-auto object-contain group-hover:animate-pulse"
                  />
                </div>
              </Link>
              <div className="hidden md:block text-purple-300 text-sm">
                🎲 Abrindo pacote épico
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-yellow-400/30">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-300 text-xl animate-pulse">💰</span>
                  <div>
                    <div className="text-yellow-300 font-bold">
                      {openResult ? openResult.newBalance : multipleOpenResult ? multipleOpenResult.newBalance : userCredits}
                    </div>
                    <div className="text-xs text-yellow-200">créditos</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-purple-400/30">
                <div className="text-white flex items-center space-x-2">
                  <span className="text-xl">👋</span>
                  <div>
                    <div className="font-semibold text-sm">Olá, {session?.user?.name?.split(' ')[0] || 'Colecionador'}</div>
                    <div className="text-xs text-gray-300">Boa sorte na abertura!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-[80vh] flex items-center justify-center">
        <div className="max-w-xs sm:max-w-2xl lg:max-w-4xl mx-auto text-center w-full">
          
          {/* Pack Opening Animation */}
          {isOpening && (
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-4 sm:p-8 lg:p-12 border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
              {quantity === 1 ? (
                <>
                  <div className="relative mb-8 sm:mb-12">
                    <div className="text-5xl sm:text-7xl lg:text-9xl mb-6 sm:mb-8 animate-pulse transform hover:scale-110 transition-transform duration-500">
                      {getPackTypeEmoji(pack.type)}
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                    ✨ Abrindo {pack.name}... ✨
                  </h2>
                  
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto border-4 border-transparent bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-spin">
                      <div className="w-full h-full border-4 border-white border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-lg animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-xl text-purple-300 font-semibold animate-pulse">
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
                </>
              ) : (
                <>
                  <div className="mb-12">
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-8 max-w-4xl mx-auto">
                      {Array.from({ length: Math.min(quantity, 18) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="relative text-5xl animate-bounce transform hover:scale-110 transition-transform duration-300"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          {getPackTypeEmoji(pack.type)}
                          <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-md animate-pulse"></div>
                        </div>
                      ))}
                      {quantity > 18 && (
                        <div className="text-4xl text-white animate-bounce font-bold bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                          +{quantity - 18}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-white mb-8 bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent">
                    🎊 Abrindo {quantity} {pack.name}s Épicos! 🎊
                  </h2>
                  
                  <div className="flex justify-center space-x-3 mb-8">
                    {[0, 0.2, 0.4, 0.6, 0.8].map((delay, i) => (
                      <div key={i} className="relative">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-cyan-400/30 rounded-full blur-sm animate-pulse" style={{ animationDelay: `${delay}s` }}></div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-2xl p-6 border border-green-400/20">
                    <p className="text-xl text-green-300 font-semibold mb-4">
                      🎰 Processando suas {quantity} surpresas mágicas...
                    </p>
                    <div className="flex justify-center space-x-2">
                      {['🎲', '💫', '🎪', '🎭', '🎨'].map((emoji, i) => (
                        <span key={i} className="text-3xl animate-spin" style={{ animationDelay: `${i * 0.3}s`, animationDuration: '2s' }}>
                          {emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Single Pack Result Display */}
          {showResult && openResult && (
            <div ref={resultSectionRef} className="animate-bounce-in">
              {/* Celebration Header */}
              <div className="mb-6 sm:mb-8 relative">
                <div className="text-4xl sm:text-6xl lg:text-8xl mb-3 sm:mb-4 animate-bounce">
                  🎉
                </div>
                <div className="absolute -inset-4 sm:-inset-8 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="flex justify-center space-x-1 sm:space-x-2 text-2xl sm:text-3xl lg:text-4xl animate-pulse">
                  <span>✨</span><span>🎊</span><span>🎁</span><span>🎊</span><span>✨</span>
                </div>
              </div>
              
              <div className={`bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-4 sm:p-8 lg:p-10 border-2 shadow-2xl transform hover:scale-[1.02] transition-all duration-500 ${getRarityColor(openResult.item.rarity).split(' ')[1]} relative overflow-hidden`}>
                {/* Animated background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                <div className={`absolute -inset-4 ${getRarityColor(openResult.item.rarity).split(' ')[1]} rounded-3xl blur-xl opacity-30 animate-pulse`}></div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    🏆 PARABÉNS! VOCÊ GANHOU: 🏆
                  </h2>
                  
                  <div className="mb-6 sm:mb-8">
                    {/* Item Display with Enhanced Visuals */}
                    <div className="relative mb-4 sm:mb-6">
                      <div className={`w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto rounded-2xl mb-4 sm:mb-6 flex items-center justify-center text-3xl sm:text-5xl lg:text-6xl transform hover:scale-110 transition-transform duration-500 shadow-2xl ${getRarityColor(openResult.item.rarity).split(' ')[1]} relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <div className="relative z-10">🏆</div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                      <div className={`absolute -inset-4 ${getRarityColor(openResult.item.rarity).split(' ')[1]} rounded-3xl blur-2xl opacity-40 animate-pulse`}></div>
                    </div>
                    
                    <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 ${getRarityColor(openResult.item.rarity).split(' ')[0]} drop-shadow-lg`}>
                      {openResult.item.name}
                    </h3>
                    
                    <p className="text-gray-200 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg font-medium bg-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
                      {openResult.item.description}
                    </p>
                    
                    {/* Rarity Badge with Enhanced Style */}
                    <div className="mb-4 sm:mb-6">
                      <div className={`inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-base sm:text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 ${getRarityColor(openResult.item.rarity)} border-2 border-white/30 backdrop-blur-sm`}>
                        ⭐ {getRarityName(openResult.item.rarity)} ⭐
                      </div>
                    </div>
                    
                    {/* Value Display */}
                    <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-green-400/30 mb-6 sm:mb-8">
                      <div className="text-lg sm:text-xl lg:text-2xl text-green-300 font-bold flex items-center justify-center space-x-2">
                        <span className="text-xl sm:text-2xl lg:text-3xl animate-pulse">💰</span>
                        <span>Valor: {openResult.item.value} créditos</span>
                        <span className="text-xl sm:text-2xl lg:text-3xl animate-pulse">💰</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons with Enhanced Styling */}
                  <div className="space-y-4">
                    <Link
                      href="/packs"
                      className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xl group-hover:animate-pulse">🎲</span>
                        <span>Abrir Outro Pacote</span>
                        <span className="text-xl group-hover:animate-pulse">🎲</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                    
                    <Link
                      href="/inventory"
                      className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xl group-hover:animate-pulse">🎒</span>
                        <span>Ver Inventário Completo</span>
                        <span className="text-xl group-hover:animate-pulse">🎒</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                    
                    <Link
                      href="/dashboard"
                      className="block text-gray-300 hover:text-white transition duration-300 text-lg font-medium bg-white/10 rounded-2xl py-3 px-6 backdrop-blur-sm hover:bg-white/20"
                    >
                      ← Voltar ao Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Packs Result Display - Instant Mode */}
          {showResult && multipleOpenResult && displayMode === 'instant' && (
            <div ref={resultSectionRef} className="animate-bounce-in">
              {/* Celebration Header */}
              <div className="mb-8 relative">
                <div className="text-8xl mb-4 animate-bounce">🎊</div>
                <div className="absolute -inset-8 bg-gradient-to-r from-rainbow-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="flex justify-center space-x-2 text-4xl animate-pulse">
                  <span>🌟</span><span>🎭</span><span>🎪</span><span>🎭</span><span>🌟</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-2xl relative overflow-hidden">
                {/* Animated background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                
                <div className="relative z-10">
                  <h2 className="text-4xl font-bold text-white mb-8 text-center bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    🎰 JACKPOT! Você abriu {multipleOpenResult.summary.totalItems} pacotes épicos! 🎰
                  </h2>
                  
                  {/* Enhanced Summary Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-blue-400/30 transform hover:scale-105 transition-all duration-300 shadow-xl">
                      <div className="text-3xl font-bold text-blue-300 mb-2">{multipleOpenResult.summary.totalItems}</div>
                      <div className="text-sm text-blue-200 font-semibold">🎁 Itens Obtidos</div>
                      <div className="w-full h-1 bg-blue-500/30 rounded mt-2">
                        <div className="h-full bg-blue-400 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-green-400/30 transform hover:scale-105 transition-all duration-300 shadow-xl">
                      <div className="text-3xl font-bold text-green-300 mb-2">{multipleOpenResult.summary.totalValue}</div>
                      <div className="text-sm text-green-200 font-semibold">💰 Valor Total</div>
                      <div className="w-full h-1 bg-green-500/30 rounded mt-2">
                        <div className="h-full bg-green-400 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-600/30 to-violet-600/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-purple-400/30 transform hover:scale-105 transition-all duration-300 shadow-xl">
                      <div className="text-3xl font-bold text-purple-300 mb-2">{multipleOpenResult.summary.rarityCounts.EPICO || 0}</div>
                      <div className="text-sm text-purple-200 font-semibold">💜 Itens Épicos</div>
                      <div className="w-full h-1 bg-purple-500/30 rounded mt-2">
                        <div className="h-full bg-purple-400 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600/30 to-amber-600/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-yellow-400/30 transform hover:scale-105 transition-all duration-300 shadow-xl">
                      <div className="text-3xl font-bold text-yellow-300 mb-2">{multipleOpenResult.summary.rarityCounts.LENDARIO || 0}</div>
                      <div className="text-sm text-yellow-200 font-semibold">⭐ Itens Lendários</div>
                      <div className="w-full h-1 bg-yellow-500/30 rounded mt-2">
                        <div className="h-full bg-yellow-400 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Items Grid - Mobile Optimized */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-10">
                    {multipleOpenResult.items.map((item, index) => (
                      <div key={index} className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border-2 shadow-xl transform hover:scale-105 transition-all duration-300 ${getRarityColor(item.rarity).split(' ')[1]} relative overflow-hidden group min-h-[280px] flex flex-col`}>
                        {/* Item glow effect */}
                        <div className={`absolute -inset-2 ${getRarityColor(item.rarity).split(' ')[1]} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                        
                        <div className="relative z-10 flex flex-col flex-1">
                          {/* Centered Item Icon with fixed size */}
                          <div className="flex justify-center items-center mb-4 flex-shrink-0">
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg transform group-hover:scale-110 transition-transform duration-300 ${getRarityColor(item.rarity).split(' ')[1]} relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              <div className="relative z-10">🏆</div>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </div>
                          </div>
                          
                          {/* Item Name with proper wrapping and spacing */}
                          <h4 className={`text-base sm:text-lg font-bold mb-3 text-center ${getRarityColor(item.rarity).split(' ')[0]} drop-shadow-lg leading-tight min-h-[2.5rem] flex items-center justify-center px-1`}>
                            <span className="break-words hyphens-auto">{item.name}</span>
                          </h4>
                          
                          {/* Rarity Badge with responsive text */}
                          <div className={`text-center px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transform group-hover:scale-105 transition-all duration-300 ${getRarityColor(item.rarity)} border border-white/30 backdrop-blur-sm mb-3`}>
                            <div className="break-words">
                              ⭐ {getRarityName(item.rarity)} ⭐
                            </div>
                          </div>
                          
                          {/* Credits at bottom */}
                          <div className="text-center text-green-300 text-xs sm:text-sm font-semibold bg-green-500/20 rounded-lg py-2 border border-green-400/30 mt-auto">
                            💰 {item.value} créditos
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Enhanced Action Buttons */}
                  <div className="space-y-4">
                    <Link
                      href="/packs"
                      className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xl group-hover:animate-pulse">🎲</span>
                        <span>Abrir Mais Pacotes Épicos</span>
                        <span className="text-xl group-hover:animate-pulse">🎲</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                    
                    <Link
                      href="/inventory"
                      className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xl group-hover:animate-pulse">🎒</span>
                        <span>Ver Inventário Completo</span>
                        <span className="text-xl group-hover:animate-pulse">🎒</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                    
                    <Link
                      href="/dashboard"
                      className="block text-gray-300 hover:text-white transition duration-300 text-lg font-medium bg-white/10 rounded-2xl py-3 px-6 backdrop-blur-sm hover:bg-white/20 text-center"
                    >
                      ← Voltar ao Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Packs Result Display - Suspense Mode */}
          {showResult && multipleOpenResult && displayMode === 'suspense' && (
            <div ref={!openResult ? resultSectionRef : undefined} className="animate-bounce-in">
              {/* Suspense Header */}
              <div className="mb-8 relative">
                <div className="text-8xl mb-4 animate-spin" style={{animationDuration: '3s'}}>🎭</div>
                <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="flex justify-center space-x-2 text-4xl animate-pulse">
                  <span>🔮</span><span>🎪</span><span>🎯</span><span>🎪</span><span>🔮</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-2xl relative overflow-hidden">
                {/* Animated background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple/5 to-transparent animate-pulse"></div>
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                
                <div className="relative z-10">
                  <h2 className="text-4xl font-bold text-white mb-6 text-center bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    🔮 Revelando Seus Tesouros Místicos... 🔮
                  </h2>
                  
                  {/* Enhanced Progress Display */}
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30 inline-block">
                      <span className="text-purple-300 font-bold text-xl">
                        ✨ Item {currentItemIndex + 1} de {multipleOpenResult.items.length} ✨
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Current Item Display */}
                  {multipleOpenResult.items[currentItemIndex] && (
                    <div className={`bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-8 border-2 shadow-2xl mb-8 transform hover:scale-[1.02] transition-all duration-500 ${getRarityColor(multipleOpenResult.items[currentItemIndex].rarity).split(' ')[1]} relative overflow-hidden`}>
                      {/* Item-specific glow effect */}
                      <div className={`absolute -inset-4 ${getRarityColor(multipleOpenResult.items[currentItemIndex].rarity).split(' ')[1]} rounded-3xl blur-2xl opacity-40 animate-pulse`}></div>
                      
                      <div className="relative z-10">
                        {/* Enhanced Item Icon */}
                        <div className="relative mb-6">
                          <div className={`w-36 h-36 mx-auto rounded-3xl mb-6 flex items-center justify-center text-5xl transform hover:scale-110 transition-transform duration-500 shadow-2xl ${getRarityColor(multipleOpenResult.items[currentItemIndex].rarity).split(' ')[1]} relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            <div className="relative z-10 animate-pulse">🏆</div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                          </div>
                          <div className={`absolute -inset-4 ${getRarityColor(multipleOpenResult.items[currentItemIndex].rarity).split(' ')[1]} rounded-3xl blur-2xl opacity-30 animate-pulse`}></div>
                        </div>
                        
                        <h3 className={`text-3xl font-bold mb-4 text-center ${getRarityColor(multipleOpenResult.items[currentItemIndex].rarity).split(' ')[0]} drop-shadow-lg`}>
                          {multipleOpenResult.items[currentItemIndex].name}
                        </h3>
                        
                        <p className="text-gray-200 mb-6 text-lg font-medium bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 text-center">
                          {multipleOpenResult.items[currentItemIndex].description}
                        </p>
                        
                        {/* Enhanced Rarity Badge */}
                        <div className="text-center mb-6">
                          <div className={`inline-block px-6 py-3 rounded-2xl text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 ${getRarityColor(multipleOpenResult.items[currentItemIndex].rarity)} border-2 border-white/30 backdrop-blur-sm`}>
                            ⭐ {getRarityName(multipleOpenResult.items[currentItemIndex].rarity)} ⭐
                          </div>
                        </div>
                        
                        {/* Enhanced Value Display */}
                        <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 backdrop-blur-sm rounded-2xl p-4 border border-green-400/30 text-center">
                          <div className="text-2xl text-green-300 font-bold flex items-center justify-center space-x-2">
                            <span className="text-3xl animate-pulse">💰</span>
                            <span>Valor: {multipleOpenResult.items[currentItemIndex].value} créditos</span>
                            <span className="text-3xl animate-pulse">💰</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Navigation Controls */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                    {currentItemIndex < multipleOpenResult.items.length - 1 ? (
                      <>
                        <button
                          onClick={showNextItem}
                          className="group px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <span className="text-xl group-hover:animate-bounce">🎲</span>
                            <span>Próximo Tesouro</span>
                            <span className="text-xl group-hover:animate-bounce">🎲</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </button>
                        {!autoProgress ? (
                          <button
                            onClick={startAutoProgress}
                            className="group px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                          >
                            <div className="flex items-center justify-center space-x-3">
                              <span className="text-xl group-hover:animate-pulse">🚀</span>
                              <span>Auto-Revelar Rápido</span>
                              <span className="text-xl group-hover:animate-pulse">🚀</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          </button>
                        ) : (
                          <button
                            onClick={stopAutoProgress}
                            className="group px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                          >
                            <div className="flex items-center justify-center space-x-3">
                              <span className="text-xl group-hover:animate-pulse">⏸️</span>
                              <span>Pausar Auto-Revelar</span>
                              <span className="text-xl group-hover:animate-pulse">⏸️</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          </button>
                        )}
                        <button
                          onClick={showAllItems}
                          className="group px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <span className="text-xl group-hover:animate-pulse">⚡</span>
                            <span>Revelar Todos</span>
                            <span className="text-xl group-hover:animate-pulse">⚡</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={showAllItems}
                        className="group px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-xl group-hover:animate-pulse">📊</span>
                          <span>Ver Resumo Épico Completo</span>
                          <span className="text-xl group-hover:animate-pulse">📊</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </button>
                    )}
                  </div>
                  
                  {/* Enhanced Progress Indicator */}
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-300 font-semibold">Progresso da Revelação</span>
                        <span className="text-pink-300 font-bold">{Math.round(((currentItemIndex + 1) / multipleOpenResult.items.length) * 100)}%</span>
                      </div>
                      <div className="w-full bg-purple-900/50 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                          style={{ width: `${((currentItemIndex + 1) / multipleOpenResult.items.length) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Action Buttons */}
                  <div className="space-y-4">
                    <Link
                      href="/packs"
                      className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xl group-hover:animate-pulse">🎲</span>
                        <span>Abrir Mais Pacotes Mágicos</span>
                        <span className="text-xl group-hover:animate-pulse">🎲</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                    
                    <Link
                      href="/inventory"
                      className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xl group-hover:animate-pulse">🎒</span>
                        <span>Ver Coleção Completa</span>
                        <span className="text-xl group-hover:animate-pulse">🎒</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                    
                    <Link
                      href="/dashboard"
                      className="block text-gray-300 hover:text-white transition duration-300 text-lg font-medium bg-white/10 rounded-2xl py-3 px-6 backdrop-blur-sm hover:bg-white/20 text-center"
                    >
                      ← Voltar ao Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!isOpening && !showResult && (
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-2xl transform hover:scale-[1.01] transition-all duration-500">
              <div className="relative mb-8">
                <div className="text-9xl mb-8 transform hover:scale-110 transition-transform duration-500 animate-pulse">
                  {getPackTypeEmoji(pack.type)}
                </div>
                <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              
              <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                {pack.name}
              </h1>
              
              <p className="text-gray-200 mb-10 text-xl font-medium bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                {pack.description}
              </p>
              
              {/* Quantity Selector */}
              <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center space-x-3">
                  <span className="text-3xl animate-pulse">🎯</span>
                  <span>Quantidade de Pacotes</span>
                  <span className="text-3xl animate-pulse">🎯</span>
                </h3>
                
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
                  <button
                    onClick={() => adjustQuantity(-1)}
                    disabled={quantity <= 1}
                    className="w-12 h-12 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold rounded-lg transition duration-200"
                  >
                    -
                  </button>
                  
                  <div className="bg-white/20 px-6 py-3 rounded-lg min-w-[100px] text-center">
                    <span className="text-2xl font-bold text-white">{quantity}</span>
                  </div>
                  
                  <button
                    onClick={() => adjustQuantity(1)}
                    disabled={quantity >= getMaxQuantity()}
                    className="w-12 h-12 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold rounded-lg transition duration-200"
                  >
                    +
                  </button>
                </div>
                
                {/* Quick Select Buttons */}
                <div className="flex justify-center space-x-2 mb-4">
                  {[1, 5, 10, 25].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuantity(Math.min(num, getMaxQuantity()))}
                      disabled={num > getMaxQuantity()}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition duration-200"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setQuantity(getMaxQuantity())}
                    disabled={getMaxQuantity() === 0}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition duration-200"
                  >
                    MAX
                  </button>
                </div>
                
                {/* Cost Calculation */}
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${hasEnoughCredits() ? 'text-green-400' : 'text-red-400'}`}>
                    Custo Total: {getTotalCost()} créditos
                  </div>
                  <p className={`${hasEnoughCredits() ? 'text-gray-300' : 'text-red-300'}`}>
                    Você tem {userCredits} créditos disponíveis
                  </p>
                  {!hasEnoughCredits() && (
                    <p className="text-red-400 text-sm mt-2">
                      Você pode abrir no máximo {getMaxQuantity()} pacote(s)
                    </p>
                  )}
                </div>
              </div>
              
              {/* Display Mode Selector */}
              {quantity > 1 && (
                <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-8 mb-8 border border-white/20 shadow-xl">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center justify-center space-x-2 sm:space-x-3">
                    <span className="text-2xl sm:text-3xl animate-pulse">🎭</span>
                    <span>Modo de Exibição</span>
                    <span className="text-2xl sm:text-3xl animate-pulse">🎭</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                      onClick={() => {
                        setDisplayMode('instant')
                        setAutoProgress(false) // Stop auto-progress
                      }}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition duration-200 text-sm sm:text-base ${
                        displayMode === 'instant'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/20 text-gray-300 hover:bg-white/30'
                      }`}
                    >
                      ⚡ Resultados Instantâneos
                    </button>
                    <button
                      onClick={() => {
                        setDisplayMode('suspense')
                        setCurrentItemIndex(0) // Reset to first item when switching to suspense
                        setAutoProgress(false) // Ensure auto-progress is disabled for manual control
                      }}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition duration-200 text-sm sm:text-base ${
                        displayMode === 'suspense'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/20 text-gray-300 hover:bg-white/30'
                      }`}
                    >
                      🎭 Modo Suspense
                    </button>
                  </div>
                  <p className="text-gray-400 text-center text-sm mt-3">
                    {displayMode === 'instant' 
                      ? 'Todos os itens serão revelados de uma vez' 
                      : 'Itens serão revelados um por vez para mais suspense'
                    }
                  </p>
                </div>
              )}
              
              {/* Open Button */}
              <div className="mt-10">
                {hasEnoughCredits() ? (
                  <button
                    onClick={openPack}
                    className="group relative w-full overflow-hidden px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-2xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                      <span className="text-3xl group-hover:animate-spin">🎲</span>
                      <span>Abrir {quantity === 1 ? 'Pacote Épico' : `${quantity} Pacotes Épicos`}</span>
                      <span className="text-3xl group-hover:animate-spin">🎲</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <button
                      disabled
                      className="w-full px-10 py-5 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 text-xl font-bold rounded-2xl cursor-not-allowed opacity-50"
                    >
                      🔒 Créditos Insuficientes
                    </button>
                    <Link
                      href="/credits/purchase"
                      className="group block w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xl group-hover:animate-pulse">💰</span>
                        <span>Comprar Mais Créditos</span>
                        <span className="text-xl group-hover:animate-pulse">💰</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="mt-8">
                <Link
                  href="/packs"
                  className="text-gray-300 hover:text-white transition duration-300 text-lg font-medium bg-white/10 rounded-2xl py-3 px-6 backdrop-blur-sm hover:bg-white/20 inline-block"
                >
                  ← Voltar à Loja de Pacotes
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}