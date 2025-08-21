'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EnvironmentVariable {
  key: string
  isSet: boolean
  isRequired: boolean
  category: string
  description: string
  value?: string
  isSecret: boolean
}

interface EnvironmentValidation {
  isValid: boolean
  totalVariables: number
  setVariables: number
  missingRequired: number
  missingOptional: number
  securityIssues: string[]
  variables: EnvironmentVariable[]
  environment: string
  nodeVersion: string
  nextVersion: string
  databaseStatus: string
  redisStatus?: string
}

export default function EnvironmentValidation() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [validation, setValidation] = useState<EnvironmentValidation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/environment')
    } else if (status === 'authenticated') {
      fetchEnvironmentValidation()
    }
  }, [status, router])

  const fetchEnvironmentValidation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/environment-validation')

      if (response.ok) {
        const data = await response.json()
        setValidation(data)
      }
    } catch (error) {
      console.error('Error fetching environment validation:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'database': return 'text-blue-400 bg-blue-900/20'
      case 'auth': return 'text-green-400 bg-green-900/20'
      case 'payment': return 'text-yellow-400 bg-yellow-900/20'
      case 'email': return 'text-purple-400 bg-purple-900/20'
      case 'storage': return 'text-indigo-400 bg-indigo-900/20'
      case 'api': return 'text-cyan-400 bg-cyan-900/20'
      case 'security': return 'text-red-400 bg-red-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getStatusIcon = (variable: EnvironmentVariable) => {
    if (!variable.isSet && variable.isRequired) return '❌'
    if (!variable.isSet && !variable.isRequired) return '⚠️'
    if (variable.isSet) return '✅'
    return '❓'
  }

  const maskSecret = (value: string) => {
    if (!value || value.length <= 8) return '••••••••'
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">🔧 Carregando Validação do Ambiente...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-b border-purple-500/30 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-white font-bold text-xl">
                🎮 <span className="text-purple-300">Admin Panel</span>
              </Link>
              <div className="hidden md:block">
                <div className="text-white font-medium">
                  🔧 <span className="text-purple-300">Validação de Ambiente</span>
                </div>
                <div className="text-gray-400 text-sm">Configurações e variáveis de ambiente</div>
              </div>
            </div>
            <Link 
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Environment Status */}
        {validation && (
          <>
            {/* Overall Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🌍 Status do Ambiente
                </h2>
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  validation.isValid 
                    ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                    : 'text-red-400 bg-red-900/20 border border-red-500/30'
                }`}>
                  {validation.isValid ? '✅ Válido' : '❌ Problemas Detectados'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{validation.setVariables}/{validation.totalVariables}</div>
                  <div className="text-sm text-gray-300">Variáveis Configuradas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{validation.missingRequired}</div>
                  <div className="text-sm text-gray-300">Obrigatórias Faltando</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{validation.missingOptional}</div>
                  <div className="text-sm text-gray-300">Opcionais Faltando</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{validation.securityIssues.length}</div>
                  <div className="text-sm text-gray-300">Problemas de Segurança</div>
                </div>
              </div>

              {/* System Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-400">{validation.environment}</div>
                  <div className="text-xs text-gray-400">Ambiente</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-400">{validation.nodeVersion}</div>
                  <div className="text-xs text-gray-400">Node.js</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-400">{validation.nextVersion}</div>
                  <div className="text-xs text-gray-400">Next.js</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${
                    validation.databaseStatus === 'connected' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {validation.databaseStatus === 'connected' ? '✅ Online' : '❌ Offline'}
                  </div>
                  <div className="text-xs text-gray-400">Database</div>
                </div>
              </div>
            </div>

            {/* Security Issues */}
            {validation.securityIssues.length > 0 && (
              <div className="bg-red-900/20 backdrop-blur-lg rounded-lg p-6 mb-8 border border-red-500/30">
                <h3 className="text-xl font-bold text-red-400 mb-4">🚨 Problemas de Segurança</h3>
                <div className="space-y-2">
                  {validation.securityIssues.map((issue, index) => (
                    <div key={index} className="flex items-center space-x-2 text-red-300">
                      <span>⚠️</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-white/20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-white text-sm">
                    <input
                      type="checkbox"
                      checked={showSecrets}
                      onChange={(e) => setShowSecrets(e.target.checked)}
                      className="mr-2"
                    />
                    Mostrar valores secretos (mascarados)
                  </label>
                </div>
                
                <button
                  onClick={fetchEnvironmentValidation}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  🔄 Revalidar
                </button>
              </div>
            </div>

            {/* Environment Variables by Category */}
            <div className="space-y-6">
              {Object.entries(
                validation.variables.reduce((acc, variable) => {
                  if (!acc[variable.category]) acc[variable.category] = []
                  acc[variable.category].push(variable)
                  return acc
                }, {} as Record<string, EnvironmentVariable[]>)
              ).map(([category, variables]) => (
                <div key={category} className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
                  <div className="p-6 border-b border-white/20">
                    <h3 className="text-xl font-bold text-white">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getCategoryColor(category)}`}>
                        {category.toUpperCase()}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {variables.map((variable) => (
                        <div
                          key={variable.key}
                          className="p-4 rounded-lg border border-white/10 bg-white/5"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{getStatusIcon(variable)}</span>
                              <div>
                                <div className="font-semibold text-white font-mono">{variable.key}</div>
                                <div className="text-sm text-gray-300">{variable.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {variable.isRequired && (
                                <span className="px-2 py-1 bg-red-900/20 text-red-300 text-xs rounded">
                                  OBRIGATÓRIA
                                </span>
                              )}
                              {variable.isSecret && (
                                <span className="px-2 py-1 bg-yellow-900/20 text-yellow-300 text-xs rounded">
                                  SECRETA
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {variable.isSet && variable.value && showSecrets && (
                            <div className="mt-2 p-2 bg-black/20 rounded">
                              <div className="text-xs text-gray-400 mb-1">Valor:</div>
                              <div className="font-mono text-sm text-gray-300">
                                {variable.isSecret ? maskSecret(variable.value) : variable.value}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}