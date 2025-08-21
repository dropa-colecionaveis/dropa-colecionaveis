'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUserRankings } from '@/hooks/useUserRankings'
import { CREDIT_PACKAGES, getCreditPackage } from '@/lib/mercadopago'
import type { PaymentMethod, PaymentResponse, CreditPackage } from '@/types/payments'
import CardPaymentForm from '@/components/payments/CardPaymentForm'

export default function PurchaseCredits() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[1])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { bestRanking, loading: rankingLoading } = useUserRankings()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchUserProfile()
    }
  }, [status, router])

  const fetchUserProfile = async () => {
    try {
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
    }
  }

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
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
          packageId: selectedPackage.id,
          method: selectedPaymentMethod,
        }),
      })

      const data: PaymentResponse = await response.json()

      if (data.success) {
        setPaymentResponse(data)
        // Start polling for payment status
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
          packageId: selectedPackage.id,
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

  const startPaymentPolling = (paymentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status?paymentId=${paymentId}`)
        const payment = await response.json()
        
        if (payment.status === 'APPROVED') {
          clearInterval(pollInterval)
          alert('Pagamento aprovado! Créditos adicionados à sua conta.')
          await fetchUserProfile() // Refresh user profile
          router.push('/dashboard')
        } else if (['REJECTED', 'CANCELLED', 'EXPIRED'].includes(payment.status)) {
          clearInterval(pollInterval)
          alert(`Pagamento ${payment.status.toLowerCase()}. ${payment.failureReason || ''}`)
          setShowPaymentModal(false)
        }
      } catch (error) {
        console.error('Error polling payment status:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 15 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 15 * 60 * 1000)
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
            <div className="flex items-center space-x-4">
              {/* Level and XP */}
              {userStats && (
                <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-purple-400/30 hover:border-purple-300/50 transition-colors duration-200">
                  <Link href="/achievements" className="flex items-center space-x-3 group">
                    <div className="text-center">
                      <div className="text-purple-300 font-bold text-sm group-hover:text-purple-200 transition-colors">⭐ Nível {userStats.level || 1}</div>
                      <div className="text-xs text-gray-300 group-hover:text-purple-200 transition-colors">{userStats.totalXP || 0} XP</div>
                    </div>
                  </Link>
                </div>
              )}

              {/* User Ranking */}
              {!rankingLoading && bestRanking.position > 0 && (
                <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-indigo-400/30 hover:border-indigo-300/50 transition-colors duration-200">
                  <Link href="/rankings" className="flex items-center space-x-3 group">
                    <div className="text-center">
                      <div className="text-indigo-300 font-bold text-sm flex items-center">
                        <span className="mr-1">📊</span>
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
              <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-yellow-400/30 hover:border-yellow-300/50 transition-colors duration-200">
                <Link href="/credits/purchase" className="flex items-center space-x-2 group">
                  <span className="text-yellow-300 text-lg group-hover:scale-110 transition-transform duration-200">💰</span>
                  <div>
                    <div className="text-yellow-300 font-bold group-hover:text-yellow-200 transition-colors">{userProfile?.credits || 0}</div>
                    <div className="text-xs text-yellow-200 group-hover:text-yellow-100 transition-colors">créditos</div>
                  </div>
                </Link>
              </div>
              
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
                
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="p-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                  title="Sair"
                >
                  ✕
                </button>
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
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative cursor-pointer rounded-lg p-6 text-center transition duration-200 ${
                  selectedPackage.id === pkg.id
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

          {/* Selected Package Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Resumo da Compra</h3>
            <div className="flex justify-between items-center text-white mb-4">
              <span>{selectedPackage.credits} créditos</span>
              <span className="font-semibold">R$ {selectedPackage.price}</span>
            </div>
            <div className="text-gray-300 text-sm mb-4">
              Taxa de conversão: 1 real = {Math.round(selectedPackage.credits / selectedPackage.price)} créditos
            </div>
          </div>

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
                <div className="text-sm text-gray-300 mt-1">Até 12x sem juros</div>
              </button>
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
                        <div className="text-lg font-semibold mb-2">{selectedPackage.credits} créditos</div>
                        <div className="text-2xl font-bold text-green-400">R$ {selectedPackage.price}</div>
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
                      Aguardando pagamento... ⏳
                      <br />
                      <span className="text-yellow-400">PIX expira em 15 minutos</span>
                    </div>
                    
                    <button
                      onClick={() => {setShowPaymentModal(false); setPaymentResponse(null)}}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                    >
                      Fechar
                    </button>
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
                    <div className="text-lg font-semibold mb-2">{selectedPackage.credits} créditos</div>
                    <div className="text-2xl font-bold text-green-400">R$ {selectedPackage.price}</div>
                  </div>
                </div>
                
                <CardPaymentForm
                  amount={selectedPackage.price}
                  credits={selectedPackage.credits}
                  packageId={selectedPackage.id}
                  onPayment={handleCardPayment}
                  onCancel={() => setShowPaymentModal(false)}
                  loading={loading}
                />
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