'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    preferences: false
  })

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = localStorage.getItem('cookie-consent')
    if (!storedConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('cookie-consent', JSON.stringify(fullConsent))
    setShowBanner(false)
    
    // Initialize analytics, marketing tools, etc.
    initializeOptionalServices(fullConsent)
  }

  const handleAcceptSelected = () => {
    const selectedConsent = {
      ...consent,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('cookie-consent', JSON.stringify(selectedConsent))
    setShowBanner(false)
    
    // Initialize only selected services
    initializeOptionalServices(selectedConsent)
  }

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('cookie-consent', JSON.stringify(minimalConsent))
    setShowBanner(false)
  }

  const initializeOptionalServices = (consentData: any) => {
    // Initialize Google Analytics
    if (consentData.analytics) {
      console.log('🍪 Analytics cookies enabled')
      // gtag('consent', 'update', { analytics_storage: 'granted' })
    }
    
    // Initialize marketing tools
    if (consentData.marketing) {
      console.log('🍪 Marketing cookies enabled')
      // Facebook Pixel, etc.
    }
    
    // Initialize preferences
    if (consentData.preferences) {
      console.log('🍪 Preference cookies enabled')
      // User preference storage
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-xl w-full max-w-4xl border border-gray-600 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🍪</span>
              <h3 className="text-xl font-bold text-white">Cookies e Privacidade</h3>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {!showDetails ? (
          // Simple banner
          <div className="p-6">
            <p className="text-gray-300 leading-relaxed mb-6">
              Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar o tráfego. 
              Cookies necessários são sempre ativos para o funcionamento da plataforma. 
              <Link href="/privacy" className="text-purple-300 hover:text-purple-200 underline ml-1">
                Saiba mais em nossa Política de Privacidade
              </Link>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium"
              >
                Aceitar Todos
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium"
              >
                Personalizar
              </button>
              <button
                onClick={handleRejectAll}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Apenas Necessários
              </button>
            </div>
          </div>
        ) : (
          // Detailed options
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Necessary Cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <span className="mr-2">🔒</span>
                    Cookies Necessários
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Essenciais para o funcionamento da plataforma. Incluem autenticação, segurança e funcionalidades básicas.
                  </p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-green-600 rounded-full flex items-center">
                    <div className="w-5 h-5 bg-white rounded-full ml-1"></div>
                  </div>
                  <span className="text-xs text-gray-400 mt-1 block">Sempre ativo</span>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <span className="mr-2">📊</span>
                    Cookies de Análise
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Nos ajudam a entender como os usuários interagem com a plataforma para melhorar a experiência.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, analytics: !prev.analytics }))}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      consent.analytics ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      consent.analytics ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <span className="mr-2">🎯</span>
                    Cookies de Marketing
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Utilizados para personalizar anúncios e medir a eficácia de campanhas publicitárias.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, marketing: !prev.marketing }))}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      consent.marketing ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      consent.marketing ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* Preference Cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <span className="mr-2">⚙️</span>
                    Cookies de Preferência
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Lembram suas configurações e preferências para personalizar sua experiência.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, preferences: !prev.preferences }))}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      consent.preferences ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      consent.preferences ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-600">
              <button
                onClick={handleAcceptSelected}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium"
              >
                Aceitar Selecionados
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 rounded-b-xl border-t border-gray-600">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <p>Você pode alterar suas preferências a qualquer momento nas configurações.</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <Link href="/privacy" className="text-purple-300 hover:text-purple-200 underline">
                Política de Privacidade
              </Link>
              <Link href="/cookies" className="text-purple-300 hover:text-purple-200 underline">
                Sobre Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}