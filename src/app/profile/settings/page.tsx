'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'

type ProfileVisibility = 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE'

interface UserProfile {
  id: string
  name: string
  email: string
  profileImage?: string
  profileVisibility: ProfileVisibility
}

export default function ProfileSettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const [selectedVisibility, setSelectedVisibility] = useState<ProfileVisibility>('PUBLIC')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated' && session?.user) {
      fetchProfile()
    }
  }, [status, router, session])

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setUploadError('Tipo de arquivo inválido. Apenas JPEG, PNG e WebP são permitidos.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('Arquivo muito grande. Tamanho máximo é 5MB.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload')
      }

      // Update session with new profile image
      await update({
        ...session,
        user: {
          ...session?.user,
          image: result.imageUrl
        }
      })

      // Update profile state
      setProfile(prev => prev ? { ...prev, profileImage: result.imageUrl } : null)

      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadError(error.message || 'Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const startEditingName = () => {
    setNewDisplayName(profile?.name || '')
    setIsEditingName(true)
    setNameError(null)
    setNameSuccess(false)
  }

  const cancelEditingName = () => {
    setIsEditingName(false)
    setNewDisplayName('')
    setNameError(null)
  }

  const handleNameUpdate = async () => {
    if (!newDisplayName.trim()) {
      setNameError('Nome não pode estar vazio')
      return
    }

    if (newDisplayName.trim().length < 2) {
      setNameError('Nome deve ter pelo menos 2 caracteres')
      return
    }

    if (newDisplayName.trim().length > 50) {
      setNameError('Nome deve ter no máximo 50 caracteres')
      return
    }

    try {
      setNameSaving(true)
      setNameError(null)

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newDisplayName.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar nome')
      }

      // Update session with new name
      await update({
        ...session,
        user: {
          ...session?.user,
          name: newDisplayName.trim()
        }
      })

      // Update profile state
      setProfile(prev => prev ? { ...prev, name: newDisplayName.trim() } : null)

      setIsEditingName(false)
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)

    } catch (error: any) {
      console.error('Name update error:', error)
      setNameError(error.message || 'Erro ao atualizar nome')
    } finally {
      setNameSaving(false)
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
                    {profile?.profileImage ? (
                      <Image
                        src={profile.profileImage}
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

          {/* Profile Picture Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">📸</span>
              Foto do Profile
            </h2>

            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Current Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-6xl font-bold text-white shadow-lg">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt={profile.name || 'Profile'}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              {/* Upload Section */}
              <div className="flex-1 text-center md:text-left">
                <button
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-3"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Fazendo upload...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📷</span>
                      Escolher Nova Foto
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <p className="text-gray-400 text-sm mb-4">
                  Formatos suportados: JPEG, PNG, WebP • Tamanho máximo: 5MB
                </p>

                {/* Success Message */}
                {uploadSuccess && (
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-3 mb-3">
                    <div className="text-green-400 font-medium text-sm">
                      ✅ Foto de profile atualizada com sucesso!
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {uploadError && (
                  <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 rounded-xl p-3">
                    <div className="text-red-400 font-medium text-sm">
                      ❌ {uploadError}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Profile Info */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">👤</span>
              Informações do Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-gray-300 text-sm mb-2">Nome de Exibição</div>
                {isEditingName ? (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium text-lg focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all duration-200"
                        placeholder="Digite seu nome..."
                        maxLength={50}
                        disabled={nameSaving}
                      />
                      <div className="text-gray-400 text-xs mt-1">
                        {newDisplayName.length}/50 caracteres
                      </div>
                    </div>
                    
                    {nameError && (
                      <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 rounded-xl p-3">
                        <div className="text-red-400 font-medium text-sm">
                          ❌ {nameError}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handleNameUpdate}
                        disabled={nameSaving || !newDisplayName.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {nameSaving ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Salvando...</span>
                          </div>
                        ) : (
                          '✅ Salvar'
                        )}
                      </button>
                      <button
                        onClick={cancelEditingName}
                        disabled={nameSaving}
                        className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50"
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="text-white font-medium text-lg">{profile.name}</div>
                    <button
                      onClick={startEditingName}
                      className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                )}

                {nameSuccess && (
                  <div className="mt-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-3">
                    <div className="text-green-400 font-medium text-sm">
                      ✅ Nome atualizado com sucesso!
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-gray-300 text-sm mb-2">Email</div>
                <div className="text-white font-medium text-lg">{profile.email}</div>
                <div className="text-gray-400 text-xs mt-1">
                  O email não pode ser alterado
                </div>
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
                {profile?.profileImage ? (
                  <Image
                    src={profile.profileImage}
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
                <div className="text-gray-400 text-sm">Configurações</div>
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