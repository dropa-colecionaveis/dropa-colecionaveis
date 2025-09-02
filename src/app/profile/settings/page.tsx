'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'

type ProfileVisibility = 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE'

interface UserProfile {
  id: string
  name: string
  email: string
  profileVisibility: ProfileVisibility
}

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [selectedVisibility, setSelectedVisibility] = useState<ProfileVisibility>('PUBLIC')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated' && session?.user) {
      fetchProfile()
    }
  }, [status, router, session])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile', {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
        setSelectedVisibility(profileData.profileVisibility || 'PUBLIC')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVisibilityChange = async (visibility: ProfileVisibility) => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileVisibility: visibility
        })
      })

      if (response.ok) {
        setSelectedVisibility(visibility)
        setProfile(prev => prev ? { ...prev, profileVisibility: visibility } : null)
      } else {
        console.error('Failed to update profile visibility')
      }
    } catch (error) {
      console.error('Error updating profile visibility:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    signOut({ callbackUrl: '/' })
  }

  const getVisibilityDescription = (visibility: ProfileVisibility) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'Qualquer pessoa pode ver seu profile público, incluindo estatísticas, conquistas e rankings.'
      case 'FRIENDS_ONLY':
        return 'Apenas amigos podem ver seu profile público. (Funcionalidade de amigos em desenvolvimento)'
      case 'PRIVATE':
        return 'Seu profile estará completamente privado e não aparecerá para outros usuários.'
      default:
        return ''
    }
  }

  const getVisibilityIcon = (visibility: ProfileVisibility) => {
    switch (visibility) {
      case 'PUBLIC':
        return '🌍'
      case 'FRIENDS_ONLY':
        return '👥'
      case 'PRIVATE':
        return '🔒'
      default:
        return '❓'
    }
  }

  if (status === 'loading' || loading) {
    return <LoadingSpinner />
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (!profile) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
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
              <div className="hidden md:block">
                <div className="text-white font-medium">
                  ⚙️ <span className="text-purple-300">Configurações de Profile</span>
                </div>
                <div className="text-gray-400 text-sm">Gerencie a privacidade do seu profile público</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href={`/profile/${profile.id}`}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 font-medium"
              >
                👤 Ver Meu Profile
              </Link>
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="mr-3">⚙️</span>
              Configurações de Profile
            </h1>
            <p className="text-gray-300 text-lg">
              Controle quem pode ver seu profile público
            </p>
          </div>

          {/* Current Profile Info */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">👤</span>
              Informações do Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-gray-300 text-sm mb-2">Nome</div>
                <div className="text-white font-medium text-lg">{profile.name}</div>
              </div>
              <div>
                <div className="text-gray-300 text-sm mb-2">Email</div>
                <div className="text-white font-medium text-lg">{profile.email}</div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/40 rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="text-blue-400 text-2xl">{getVisibilityIcon(selectedVisibility)}</span>
                <div>
                  <div className="text-blue-300 font-bold">
                    Visibilidade Atual: {selectedVisibility === 'PUBLIC' ? 'Público' : selectedVisibility === 'FRIENDS_ONLY' ? 'Apenas Amigos' : 'Privado'}
                  </div>
                  <div className="text-blue-200 text-sm">
                    {getVisibilityDescription(selectedVisibility)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">👁️</span>
              Configurações de Visibilidade
            </h2>
            
            <div className="space-y-6">
              {/* Public Option */}
              <div 
                className={`group p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-2xl ${
                  selectedVisibility === 'PUBLIC'
                    ? 'bg-gradient-to-br from-green-600/30 to-emerald-600/30 border-green-500/50 text-white'
                    : 'bg-gradient-to-br from-white/5 to-white/2 border-white/10 text-gray-300 hover:bg-white/15 hover:border-white/30'
                }`}
                onClick={() => handleVisibilityChange('PUBLIC')}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <span className="text-4xl group-hover:animate-pulse">🌍</span>
                  <div>
                    <span className="font-bold text-xl">Público</span>
                    {selectedVisibility === 'PUBLIC' && (
                      <span className="ml-3 bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1 rounded-full text-white text-sm font-semibold animate-pulse">Ativo</span>
                    )}
                  </div>
                </div>
                <p className="text-sm opacity-90 leading-relaxed pl-16">
                  Qualquer pessoa pode ver seu profile público, incluindo estatísticas, conquistas e rankings. Recomendado para jogadores que querem mostrar seus feitos.
                </p>
              </div>

              {/* Friends Only Option */}
              <div 
                className={`group p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-2xl ${
                  selectedVisibility === 'FRIENDS_ONLY'
                    ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border-blue-500/50 text-white'
                    : 'bg-gradient-to-br from-white/5 to-white/2 border-white/10 text-gray-300 hover:bg-white/15 hover:border-white/30'
                }`}
                onClick={() => handleVisibilityChange('FRIENDS_ONLY')}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <span className="text-4xl group-hover:animate-pulse">👥</span>
                  <div>
                    <span className="font-bold text-xl">Apenas Amigos</span>
                    {selectedVisibility === 'FRIENDS_ONLY' && (
                      <span className="ml-3 bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 rounded-full text-white text-sm font-semibold animate-pulse">Ativo</span>
                    )}
                    <span className="ml-3 bg-gradient-to-r from-orange-600 to-red-600 px-2 py-1 rounded-full text-white text-xs font-semibold">Em desenvolvimento</span>
                  </div>
                </div>
                <p className="text-sm opacity-90 leading-relaxed pl-16">
                  Apenas amigos poderão ver seu profile público. Sistema de amizades em desenvolvimento - por enquanto funciona como privado.
                </p>
              </div>

              {/* Private Option */}
              <div 
                className={`group p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-2xl ${
                  selectedVisibility === 'PRIVATE'
                    ? 'bg-gradient-to-br from-red-600/30 to-pink-600/30 border-red-500/50 text-white'
                    : 'bg-gradient-to-br from-white/5 to-white/2 border-white/10 text-gray-300 hover:bg-white/15 hover:border-white/30'
                }`}
                onClick={() => handleVisibilityChange('PRIVATE')}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <span className="text-4xl group-hover:animate-pulse">🔒</span>
                  <div>
                    <span className="font-bold text-xl">Privado</span>
                    {selectedVisibility === 'PRIVATE' && (
                      <span className="ml-3 bg-gradient-to-r from-red-600 to-pink-600 px-3 py-1 rounded-full text-white text-sm font-semibold animate-pulse">Ativo</span>
                    )}
                  </div>
                </div>
                <p className="text-sm opacity-90 leading-relaxed pl-16">
                  Seu profile estará completamente privado. Outros usuários não poderão ver suas informações públicas. Você ainda aparecerá nos rankings com seu nome.
                </p>
              </div>
            </div>

            {saving && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 text-blue-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
                  <span>Salvando configurações...</span>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30 shadow-xl">
            <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
              <span className="mr-3">ℹ️</span>
              Informações Importantes
            </h3>
            <div className="space-y-3 text-yellow-100 text-sm leading-relaxed">
              <div>• Mesmo com profile privado, seu nome ainda aparecerá nos rankings públicos</div>
              <div>• As configurações são aplicadas imediatamente ao selecionar uma opção</div>
              <div>• Você pode alterar a visibilidade a qualquer momento</div>
              <div>• O sistema de amigos está em desenvolvimento e será lançado em breve</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 space-y-4">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/profile/${profile.id}`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
              >
                👤 Ver Meu Profile
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
              >
                ← Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>

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