'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function PublicHeader() {
  const { data: session, status } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (status === 'loading') {
    return (
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-pulse">
              <div className="w-32 h-8 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  if (session?.user) {
    // Header para usuários logados
    return (
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center group">
              <Image
                src="/Dropa!.png"
                alt="Dropa! - Colecionáveis Digitais"
                width={120}
                height={60}
                className="drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className="text-white hover:text-purple-300 transition-colors font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/packs" 
                className="text-white hover:text-purple-300 transition-colors font-medium"
              >
                Pacotes
              </Link>
              <Link 
                href="/inventory" 
                className="text-white hover:text-purple-300 transition-colors font-medium"
              >
                Inventário
              </Link>
              <Link 
                href="/marketplace" 
                className="text-white hover:text-purple-300 transition-colors font-medium"
              >
                Marketplace
              </Link>
              <Link 
                href="/collections" 
                className="text-white hover:text-purple-300 transition-colors font-medium"
              >
                Coleções
              </Link>
              <Link 
                href="/rankings" 
                className="text-white hover:text-purple-300 transition-colors font-medium"
              >
                Rankings
              </Link>
            </nav>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-white hover:text-purple-300 transition-colors group"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-sm">
                  {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                </div>
                <span className="hidden md:block font-medium">
                  {session.user.name || 'Usuário'}
                </span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 shadow-xl">
                  <div className="py-2">
                    <Link
                      href="/account/data-request"
                      className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Meus Dados
                    </Link>
                    <Link
                      href="/privacy"
                      className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Privacidade
                    </Link>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' })
                        setShowUserMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Header para usuários não logados
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/Dropa!.png"
              alt="Dropa! - Colecionáveis Digitais"
              width={120}
              height={60}
              className="drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </Link>

          {/* Navigation for public pages */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/privacy" 
              className="text-white hover:text-purple-300 transition-colors font-medium"
            >
              Privacidade
            </Link>
            <Link 
              href="/terms" 
              className="text-white hover:text-purple-300 transition-colors font-medium"
            >
              Termos
            </Link>
            <Link 
              href="/cookies" 
              className="text-white hover:text-purple-300 transition-colors font-medium"
            >
              Cookies
            </Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="text-white hover:text-purple-300 transition-colors font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}