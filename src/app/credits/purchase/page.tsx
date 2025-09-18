'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserRankings } from '@/hooks/useUserRankings'
// Removido import direto - vamos usar API route
import type { PaymentMethod, PaymentResponse, CreditPackage } from '@/types/payments'
import CardPaymentForm from '@/components/payments/CardPaymentForm'
import { HeaderStatsSkeleton, CreditPackagesSkeleton } from '@/components/SkeletonLoader'

export default function PurchaseCredits() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(false)
  const [autoCheckingPayment, setAutoCheckingPayment] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  const [showSuccessState, setShowSuccessState] = useState(false)
  const [successCredits, setSuccessCredits] = useState(0)
  const { bestRanking, loading: rankingLoading } = useUserRankings()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchUserProfile()
      loadCreditPackages()
    }
  }, [status, router])

  const loadCreditPackages = async () => {
    try {
      setPackagesLoading(true)
      const response = await fetch('/api/credit-packages')
      
      if (response.ok) {
        const data = await response.json()
        const packages = data.packages || []
        setCreditPackages(packages)
        
        // Selecionar o pacote popular por padrão
        console.log('🔍 Pacotes carregados:', packages)
        const popularPackage = packages.find(pkg => pkg.isPopular)
        console.log('📦 Pacote popular encontrado:', popularPackage)
        
        if (popularPackage) {
          setSelectedPackage(popularPackage)
          console.log('✅ Pacote selecionado (popular):', popularPackage)
        } else if (packages.length > 0) {
          setSelectedPackage(packages[0])
          console.log('⚠️ Nenhum popular, selecionado primeiro:', packages[0])
        }
      } else {
        console.error('Failed to load credit packages')
        // Fallback para pacotes fixos em caso de erro
        const fallbackPackages = [
          { id: 1, credits: 100, price: 10, popular: false },
          { id: 2, credits: 250, price: 20, popular: true },
          { id: 3, credits: 500, price: 35, popular: false },
          { id: 4, credits: 1000, price: 60, popular: false },
          { id: 5, credits: 2500, price: 120, popular: false }
        ]
        setCreditPackages(fallbackPackages)
        // Selecionar o pacote popular no fallback também
        const popularFallback = fallbackPackages.find(pkg => pkg.popular)
        setSelectedPackage(popularFallback || fallbackPackages[0])
      }
    } catch (error) {
      console.error('Error loading credit packages:', error)
      // Fallback para pacotes fixos em caso de erro
      const fallbackPackages = [
        { id: 1, credits: 100, price: 10, popular: false },
        { id: 2, credits: 250, price: 20, popular: true },
        { id: 3, credits: 500, price: 35, popular: false },
        { id: 4, credits: 1000, price: 60, popular: false },
        { id: 5, credits: 2500, price: 120, popular: false }
      ]
      setCreditPackages(fallbackPackages)
      // Selecionar o pacote popular no catch também
      const popularCatch = fallbackPackages.find(pkg => pkg.popular)
      setSelectedPackage(popularCatch || fallbackPackages[0])
    } finally {
      setPackagesLoading(false)
    }
  }

  // Close user menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-user-menu]') && !target.closest('[data-menu-item]')) {
          setShowUserMenu(false)
        }
      }
    }

    const handleScroll = () => {
      if (showUserMenu) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [showUserMenu])

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      setStatsLoading(true)

      const [profileResponse, statsResponse] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/stats')
      ])

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUserProfile(profileData)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setProfileLoading(false)
      setStatsLoading(false)
    }
  }

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    // Reset all states when starting new payment
    setShowSuccessState(false)
    setSuccessCredits(0)
    setAutoCheckingPayment(false)
    setPollCount(0)
    setShowPaymentModal(true)
  }

  const handlePIXPayment = async () => {
    if (!selectedPaymentMethod) return

    setLoading(true)

    try {
      const response = await fetch('/api/payments/mercadopago/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage?.id,
          method: selectedPaymentMethod,
        }),
      })

      const data: PaymentResponse = await response.json()

      if (data.success) {
        setPaymentResponse(data)
        // Start polling for payment status
        setAutoCheckingPayment(true)
        setPollCount(0)
        startPaymentPolling(data.paymentId)
      } else {
        alert(data.error || 'Erro ao criar pagamento PIX. Tente novamente.')
        setShowPaymentModal(false)
      }
    } catch (error) {
      alert('Erro na comunicação. Tente novamente.')
      setShowPaymentModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCardPayment = async (cardData: any) => {
    setLoading(true)

    try {
      const response = await fetch('/api/payments/mercadopago/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage?.id,
          method: selectedPaymentMethod,
          ...cardData,
        }),
      })

      const data: PaymentResponse = await response.json()

      if (data.success) {
        setPaymentResponse(data)

        if (data.status === 'APPROVED') {
          // Payment approved immediately
          alert(data.message || 'Pagamento aprovado! Créditos adicionados à sua conta.')
          await fetchUserProfile() // Refresh user profile to show new credits
          setShowPaymentModal(false)
          router.push('/dashboard')
        } else if (data.status === 'PENDING') {
          // Payment is pending - show specific message and start polling
          alert(data.message || 'Pagamento pendente. Aguardando confirmação...')
          startPaymentPolling(data.paymentId)
        } else if (data.status === 'REJECTED') {
          // Payment rejected - show specific error message
          alert(data.message || 'Pagamento recusado. Verifique os dados do cartão.')
          setShowPaymentModal(false)
        } else {
          // Other statuses - start polling
          startPaymentPolling(data.paymentId)
        }
      } else {
        // API returned success: false
        if (data.status === 'REJECTED') {
          alert(data.message || 'Pagamento recusado. Verifique os dados do cartão.')
        } else {
          alert(data.error || 'Erro ao processar pagamento. Tente novamente.')
        }
        setShowPaymentModal(false)
      }
    } catch (error) {
      alert('Erro na comunicação. Tente novamente.')
      setShowPaymentModal(false)
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async (paymentId: string) => {
    setCheckingPaymentStatus(true)
    
    try {
      const response = await fetch('/api/payments/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.status === 'APPROVED') {
          alert(`🎉 ${result.message}`)
          await fetchUserProfile() // Refresh user profile
          setShowPaymentModal(false)
          setPaymentResponse(null)
          router.push('/dashboard')
        } else if (result.status === 'REJECTED' || result.status === 'CANCELLED') {
          alert(`❌ ${result.message}`)
          setShowPaymentModal(false)
          setPaymentResponse(null)
        } else {
          alert('⏳ Pagamento ainda está pendente. Tente novamente em alguns instantes.')
        }
      } else {
        alert(result.error || 'Erro ao verificar status do pagamento')
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      alert('Erro ao verificar status do pagamento')
    } finally {
      setCheckingPaymentStatus(false)
    }
  }

  const startPaymentPolling = (paymentId: string) => {
    // Clear any existing polling
    if (pollInterval) {
      clearInterval(pollInterval)
    }
    
    const newPollInterval = setInterval(async () => {
      try {
        setPollCount(prev => prev + 1)
        const response = await fetch(`/api/payments/status?paymentId=${paymentId}`)
        const payment = await response.json()

        if (payment.status === 'APPROVED') {
          clearInterval(newPollInterval)
          setPollInterval(null)
          setAutoCheckingPayment(false)
          
          // Update payment response to show success state
          setPaymentResponse(prev => prev ? { ...prev, status: 'APPROVED' } : null)
          
          // Show integrated success state instead of alert
          setSuccessCredits(payment.credits || selectedPackage?.credits || 0)
          setShowSuccessState(true)
          
          // Refresh user profile in background
          await fetchUserProfile()
          
        } else if (['REJECTED', 'CANCELLED', 'EXPIRED'].includes(payment.status)) {
          clearInterval(newPollInterval)
          setPollInterval(null)
          setAutoCheckingPayment(false)
          setPaymentResponse(prev => prev ? { ...prev, status: payment.status } : null)
          
          setTimeout(() => {
            alert(`❌ Pagamento ${payment.status.toLowerCase()}. ${payment.failureReason || ''}`)
            setShowPaymentModal(false)
          }, 1000)
        }
        
        // Stop polling after 10 minutes (200 polls * 3 seconds)
        if (pollCount >= 200) {
          clearInterval(newPollInterval)
          setPollInterval(null)
          setAutoCheckingPayment(false)
          alert('⏰ Tempo limite excedido. Você pode verificar o status manualmente.')
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }, 3000) // Poll every 3 seconds
    
    setPollInterval(newPollInterval)

    // Stop polling after 15 minutes (backup)
    setTimeout(() => {
      clearInterval(newPollInterval)
    }, 15 * 60 * 1000)
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  // Don't block the entire page on session loading
  // if (status === 'loading') {
  //   return loading screen - removed to prevent blocking
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Session loading indicator */}
      {status === 'loading' && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse z-50"></div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
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

              {/* Page Title */}
              <div className="hidden md:block">
                <div className="text-white font-medium">
                  💰 <span className="text-purple-300">Comprar Créditos</span>
                </div>
                <div className="text-gray-400 text-sm">Recarregue sua conta para mais aventuras</div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {(statsLoading || profileLoading || rankingLoading) || (!userStats && !userProfile) ? (
                <HeaderStatsSkeleton />
              ) : (
                <>
                  {/* Level and XP - sempre visível e com tamanho normal */}
                  {userStats && (
                    <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 border border-purple-400/30 hover:border-purple-300/50 transition-colors duration-200">
                      <Link href="/achievements" className="flex items-center space-x-3 group">
                        <div className="text-center">
                          <div className="text-purple-300 font-bold text-xs sm:text-sm group-hover:text-purple-200 transition-colors">⭐ Nível {userStats.level || 1}</div>
                          <div className="text-xs text-gray-300 group-hover:text-purple-200 transition-colors">{userStats.totalXP || 0} XP</div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Container para elementos empilhados no mobile */}
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4">

                    {/* User Ranking */}
                    {!rankingLoading && bestRanking.position > 0 && (
                      <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 backdrop-blur-sm rounded-xl px-2 py-1 sm:px-4 sm:py-2 border border-indigo-400/30 hover:border-indigo-300/50 transition-colors duration-200">
                        <Link href="/rankings" className="flex items-center space-x-1 sm:space-x-3 group">
                          <div className="text-center">
                            <div className="text-indigo-300 font-bold text-xs sm:text-sm flex items-center justify-center">
                              <span className="mr-1 text-xs sm:text-sm">📊</span>
                              <span>#{bestRanking.position}</span>
                              <span className="ml-1 text-xs opacity-75">({Math.round(bestRanking.percentage)}%)</span>
                            </div>
                            <div className="text-xs text-gray-300 group-hover:text-indigo-200 transition-colors">
                              Ranking Global
                            </div>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Credits */}
                    <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-xl px-2 py-1 sm:px-4 sm:py-2 border border-yellow-400/30 hover:border-yellow-300/50 transition-colors duration-200">
                      <Link href="/credits/purchase" className="flex items-center space-x-1 sm:space-x-2 group">
                        <span className="text-yellow-300 text-sm sm:text-lg group-hover:scale-110 transition-transform duration-200">💰</span>
                        <div>
                          <div className="text-yellow-300 font-bold text-xs sm:text-sm group-hover:text-yellow-200 transition-colors">{userProfile?.credits || 0}</div>
                          <div className="text-xs text-yellow-200 group-hover:text-yellow-100 transition-colors">créditos</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                {/* Admin Link */}
                {session?.user?.email === 'admin@admin.com' && (
                  <Link
                    href="/admin"
                    className="p-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105"
                    title="Admin"
                  >
                    🔧
                  </Link>
                )}

                {/* User Menu */}
                <div data-user-menu>
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setMenuPosition({
                        top: rect.bottom + 8 + window.scrollY,
                        right: window.innerWidth - rect.right
                      })
                      setShowUserMenu(!showUserMenu)
                    }}
                    className="flex items-center space-x-2 p-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                    title="Menu do usuário"
                  >
                    {/* User Avatar */}
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                      {userProfile?.profileImage ? (
                        <Image
                          src={userProfile.profileImage}
                          alt={session?.user?.name || 'User'}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        session?.user?.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <span className="text-sm">☰</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Comprar Créditos</h1>
            <p className="text-gray-300">
              Escolha o pacote de créditos ideal para sua aventura de colecionamento
            </p>
          </div>

          {/* Credit Packages */}
          {packagesLoading ? (
            <CreditPackagesSkeleton />
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative cursor-pointer rounded-lg p-6 text-center transition duration-200 ${
                    selectedPackage?.id === pkg.id
                      ? 'bg-purple-600/30 border-2 border-purple-400'
                      : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        Popular
                      </span>
                    </div>
                  )}

                <div className="text-3xl font-bold text-white mb-2">
                  {pkg.credits}
                </div>
                <div className="text-gray-300 mb-3">créditos</div>
                <div className="text-xl font-semibold text-green-400">
                  R$ {pkg.price}
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Selected Package Details */}
          {selectedPackage && (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Resumo da Compra</h3>
              <div className="flex justify-between items-center text-white mb-4">
                <span>{selectedPackage.credits} créditos</span>
                <span className="font-semibold">R$ {selectedPackage.price}</span>
              </div>
              <div className="text-gray-300 text-sm mb-4">
                Taxa de conversão: 1 real = {(selectedPackage.credits / selectedPackage.price).toFixed(1)} créditos
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Métodos de Pagamento</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => handlePaymentMethodSelect('PIX')}
                className="border border-gray-600 rounded-lg p-4 text-center text-white cursor-pointer hover:bg-white/10 hover:border-green-400 transition duration-200 group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📱</div>
                <div className="font-semibold">PIX</div>
                <div className="text-sm text-gray-300 mt-1">Pagamento instantâneo</div>
              </button>
              <button
                onClick={() => handlePaymentMethodSelect('CREDIT_CARD')}
                className="border border-gray-600 rounded-lg p-4 text-center text-white cursor-pointer hover:bg-white/10 hover:border-blue-400 transition duration-200 group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💳</div>
                <div className="font-semibold">Cartão de Crédito</div>
                <div className="text-sm text-gray-300 mt-1">Até 3x sem juros</div>
              </button>
            </div>
          </div>

          {/* Security & Trust Section */}
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 mb-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Pagamento 100% Seguro</h3>
              <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mx-auto">
                Seus dados e transações estão protegidos pelos mais altos padrões de segurança da indústria.
                Utilizamos tecnologia de ponta para garantir que seu pagamento seja processado com total segurança.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/20 rounded-xl p-4 text-center border border-green-500/20">
                <div className="text-3xl mb-2">🔒</div>
                <h4 className="text-green-400 font-semibold mb-1">SSL 256-bit</h4>
                <p className="text-xs text-gray-300">Certificado de segurança avançado</p>
              </div>
              
              <div className="bg-black/20 rounded-xl p-4 text-center border border-blue-500/20">
                <div className="text-3xl mb-2">🏦</div>
                <h4 className="text-blue-400 font-semibold mb-1">MercadoPago</h4>
                <p className="text-xs text-gray-300">Processamento seguro e confiável</p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 text-center border border-purple-500/20">
                <div className="text-3xl mb-2">🛡️</div>
                <h4 className="text-purple-400 font-semibold mb-1">PCI DSS</h4>
                <p className="text-xs text-gray-300">Padrão de segurança da indústria</p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 text-center border border-yellow-500/20">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="text-yellow-400 font-semibold mb-1">PIX Instantâneo</h4>
                <p className="text-xs text-gray-300">Pagamento aprovado em segundos</p>
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-gray-600/30">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-8 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Dados criptografados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Não armazenamos cartões</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Transações monitoradas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Suporte 24/7</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-400">
                🔐 Todos os pagamentos são processados através de conexão segura com certificado SSL.
                <br />
                Seus dados pessoais e financeiros estão protegidos e nunca são compartilhados com terceiros.
              </p>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="text-center">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition duration-200">
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* User Menu Dropdown */}
      {showUserMenu && (
        <div 
          className="absolute w-64 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl z-[99999] overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200"
          style={{ 
            top: menuPosition.top, 
            right: menuPosition.right 
          }}
          data-user-dropdown
        >
          {/* Menu Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                {userProfile?.profileImage ? (
                  <Image
                    src={userProfile.profileImage}
                    alt={session?.user?.name || 'User'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  session?.user?.name?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div>
                <div className="text-white font-medium">{session?.user?.name || 'Usuário'}</div>
                <div className="text-gray-400 text-sm">{userProfile?.credits || 0} créditos</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* Profile */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/profile/settings'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">👤</span>
                <span>Meu Perfil</span>
              </div>
            </button>

            {/* Buy Credits */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/credits/purchase'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">💰</span>
                <span>Comprar Créditos</span>
              </div>
            </button>

            {/* Pack Store */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/packs'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">📦</span>
                <span>Loja de Pacotes</span>
              </div>
            </button>

            {/* Inventory */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/inventory'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🎒</span>
                <span>Inventário</span>
              </div>
            </button>

            {/* Collections */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/collections'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">📚</span>
                <span>Coleções</span>
              </div>
            </button>

            {/* Marketplace */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/marketplace'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🛒</span>
                <span>Marketplace</span>
              </div>
            </button>

            {/* Rankings */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/rankings'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">📊</span>
                <span>Rankings</span>
              </div>
            </button>

            {/* Achievements */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/achievements'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🏆</span>
                <span>Conquistas</span>
              </div>
            </button>

            {/* Dashboard */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/dashboard'
              }}
              className="block w-full text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg w-5 flex justify-center">🏠</span>
                <span>Dashboard</span>
              </div>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-white/10"></div>

            {/* Logout */}
            <button
              data-menu-item
              onClick={(e) => {
                e.stopPropagation()
                setShowUserMenu(false)
                setShowLogoutModal(true)
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-red-600/20 rounded-lg transition-colors duration-200 text-red-400 hover:text-red-300 text-left"
            >
              <span className="text-lg w-5 flex justify-center">🚪</span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 w-full mx-4 border border-gray-700 shadow-2xl mb-8 max-h-[85vh] overflow-y-auto ${
            selectedPaymentMethod === 'CREDIT_CARD' ? 'max-w-lg' : 'max-w-md'
          }`}>
            {selectedPaymentMethod === 'PIX' ? (
              // PIX Payment Modal
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  📱 <span className="ml-2">Pagamento PIX</span>
                </h3>

                {!paymentResponse ? (
                  <div>
                    <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-400/30">
                      <div className="text-white text-center">
                        <div className="text-lg font-semibold mb-2">{selectedPackage?.credits} créditos</div>
                        <div className="text-2xl font-bold text-green-400">R$ {selectedPackage?.price}</div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handlePIXPayment}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Gerando PIX...' : 'Gerar PIX'}
                      </button>
                    </div>
                  </div>
                ) : showSuccessState ? (
                  // Success State Display
                  <div className="text-center py-6">
                    <div className="mb-6">
                      <div className="text-6xl mb-4 animate-bounce">🎉</div>
                      <h4 className="text-2xl font-bold text-green-400 mb-2">Pagamento Aprovado!</h4>
                      <p className="text-gray-300 text-lg mb-4">
                        <span className="text-yellow-400 font-semibold">{successCredits} créditos</span> foram adicionados à sua conta
                      </p>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <span className="text-lg">✅</span>
                        <span className="font-medium">Transação concluída com sucesso</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowPaymentModal(false)
                          setPaymentResponse(null)
                          setShowSuccessState(false)
                          router.push('/dashboard')
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium"
                      >
                        🏠 Ir para Dashboard
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowPaymentModal(false)
                          setPaymentResponse(null)
                          setShowSuccessState(false)
                          router.push('/packs')
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
                      >
                        📦 Abrir Pacotes Agora
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowPaymentModal(false)
                          setPaymentResponse(null)
                          setShowSuccessState(false)
                        }}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : (
                  // PIX QR Code Display
                  <div>
                    <div className="text-center mb-6">
                      <h4 className="text-lg font-semibold text-white mb-2">Escaneie o QR Code</h4>
                      <p className="text-gray-300 text-sm">Use o app do seu banco para pagar</p>
                    </div>

                    {paymentResponse.pixQrCodeBase64 && (
                      <div className="bg-white p-4 rounded-lg mb-4 text-center">
                        <img
                          src={`data:image/png;base64,${paymentResponse.pixQrCodeBase64}`}
                          alt="PIX QR Code"
                          className="mx-auto max-w-48 max-h-48"
                        />
                      </div>
                    )}

                    {paymentResponse.pixCopyPaste && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Ou copie o código PIX:
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={paymentResponse.pixCopyPaste}
                            readOnly
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white text-sm"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(paymentResponse.pixCopyPaste || '')}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg text-sm transition-colors"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-center text-gray-300 text-sm mb-4">
                      {paymentResponse?.status === 'APPROVED' ? (
                        <>
                          <span className="text-green-400">✅ Pagamento aprovado!</span>
                          <br />
                          <span className="text-green-300">Redirecionando...</span>
                        </>
                      ) : autoCheckingPayment ? (
                        <>
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                            Verificando automaticamente... 🔄
                          </span>
                          <br />
                          <span className="text-blue-300">Verificação {pollCount}/200</span>
                          <br />
                          <span className="text-yellow-400">PIX expira em 15 minutos</span>
                        </>
                      ) : (
                        <>
                          Aguardando pagamento... ⏳
                          <br />
                          <span className="text-yellow-400">PIX expira em 15 minutos</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => checkPaymentStatus(paymentResponse.paymentId)}
                        disabled={checkingPaymentStatus || autoCheckingPayment}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {checkingPaymentStatus ? 'Verificando...' : 
                         autoCheckingPayment ? '🔄 Verificação Automática Ativa' :
                         '🔍 Verificar Status Manualmente'}
                      </button>
                      
                      <button
                        onClick={() => {
                          // Stop polling when closing modal
                          if (pollInterval) {
                            clearInterval(pollInterval)
                            setPollInterval(null)
                          }
                          setAutoCheckingPayment(false)
                          setPollCount(0)
                          setShowSuccessState(false)
                          setSuccessCredits(0)
                          setShowPaymentModal(false)
                          setPaymentResponse(null)
                        }}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Credit Card Payment Modal
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  💳 <span className="ml-2">Cartão de Crédito</span>
                </h3>

                <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-400/30">
                  <div className="text-white text-center">
                    <div className="text-lg font-semibold mb-2">{selectedPackage?.credits} créditos</div>
                    <div className="text-2xl font-bold text-green-400">R$ {selectedPackage?.price}</div>
                  </div>
                </div>

                {selectedPackage && (
                  <CardPaymentForm
                    amount={selectedPackage.price}
                    credits={selectedPackage.credits}
                    packageId={selectedPackage.id}
                    onPayment={handleCardPayment}
                    onCancel={() => setShowPaymentModal(false)}
                    loading={loading}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Saída</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja sair da sua conta?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
