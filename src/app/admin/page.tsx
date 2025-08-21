'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalItems: number
  totalPacksOpened: number
  totalCreditsInSystem: number
}

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalItems: 0,
    totalPacksOpened: 0,
    totalCreditsInSystem: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin')
    } else if (status === 'authenticated') {
      fetchAdminStats()
    }
  }, [status, router, session])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 403) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/dashboard')
        return
      } else {
        console.error('Failed to fetch admin stats')
        setStats({
          totalUsers: 0,
          totalItems: 0,
          totalPacksOpened: 0,
          totalCreditsInSystem: 0
        })
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setStats({
        totalUsers: 0,
        totalItems: 0,
        totalPacksOpened: 0,
        totalCreditsInSystem: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    try {
      setLoading(true)
      let response
      
      switch (action) {
        case 'reload-stats':
          response = await fetch('/api/admin/actions/reload-stats', { method: 'POST' })
          if (response.ok) {
            const data = await response.json()
            setStats(data.stats)
            alert('✅ Estatísticas recarregadas com sucesso!')
          }
          break
          
        case 'reset-test-data':
          if (confirm('⚠️ Isso irá remover todos os dados de teste. Continuar?')) {
            response = await fetch('/api/admin/actions/reset-test-data', { method: 'POST' })
            if (response.ok) {
              await fetchAdminStats()
              alert('✅ Dados de teste resetados com sucesso!')
            }
          }
          break
          
        case 'generate-report':
          response = await fetch('/api/admin/actions/generate-report', { method: 'POST' })
          if (response.ok) {
            const data = await response.json()
            // Download do relatório
            const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `relatorio-sistema-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            alert('✅ Relatório gerado e baixado!')
          }
          break
          
        case 'backup-system':
          response = await fetch('/api/admin/actions/backup-system', { method: 'POST' })
          if (response.ok) {
            const data = await response.json()
            alert(`✅ Backup criado: ${data.filename}`)
          }
          break
      }
      
      if (response && !response.ok) {
        const error = await response.json()
        alert(`❌ Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Quick action error:', error)
      alert('❌ Erro ao executar ação')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-white">
            Admin Panel - Colecionáveis
          </Link>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Painel Administrativo</h1>
            <p className="text-gray-300">
              Gerencie usuários, itens e configurações da plataforma
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
              <div className="text-3xl font-bold text-blue-400">{stats.totalUsers}</div>
              <div className="text-sm text-gray-300">Total de Usuários</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
              <div className="text-3xl font-bold text-green-400">{stats.totalItems}</div>
              <div className="text-sm text-gray-300">Itens Cadastrados</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
              <div className="text-3xl font-bold text-purple-400">{stats.totalPacksOpened}</div>
              <div className="text-sm text-gray-300">Pacotes Abertos</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center text-white">
              <div className="text-3xl font-bold text-yellow-400">{stats.totalCreditsInSystem}</div>
              <div className="text-sm text-gray-300">Créditos no Sistema</div>
            </div>
          </div>

          {/* Management Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-xl font-semibold mb-2">Gerenciar Usuários</h2>
              <p className="text-gray-300 mb-4">
                Visualizar e gerenciar contas de usuário
              </p>
              <Link
                href="/admin/users"
                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200"
              >
                Ver Usuários
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-xl font-semibold mb-2">Gerenciar Itens</h2>
              <p className="text-gray-300 mb-4">
                Adicionar, editar e remover itens do sistema
              </p>
              <Link
                href="/admin/items"
                className="block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition duration-200"
              >
                Gerenciar Itens
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-xl font-semibold mb-2">Configurar Pacotes</h2>
              <p className="text-gray-300 mb-4">
                Ajustar preços e probabilidades dos pacotes
              </p>
              <Link
                href="/admin/packs"
                className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200"
              >
                Configurar
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-xl font-semibold mb-2">Gerenciar Coleções</h2>
              <p className="text-gray-300 mb-4">
                Criar e organizar coleções temáticas de itens
              </p>
              <Link
                href="/admin/collections"
                className="block w-full text-center px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition duration-200"
              >
                Gerenciar
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">🏪</div>
              <h2 className="text-xl font-semibold mb-2">Marketplace</h2>
              <p className="text-gray-300 mb-4">
                Monitor transações, detectar fraudes e gerenciar regras
              </p>
              <Link
                href="/admin/marketplace"
                className="block w-full text-center px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition duration-200"
              >
                Gerenciar
              </Link>
            </div>
          </div>

          {/* Security Management Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🔐 Segurança e Monitoramento</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">Monitoramento</h3>
                <p className="text-gray-300 mb-4">
                  Eventos de segurança e alertas em tempo real
                </p>
                <Link
                  href="/admin/security"
                  className="block w-full text-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-200"
                >
                  Ver Eventos
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">Solicitações LGPD</h3>
                <p className="text-gray-300 mb-4">
                  Gerenciar dados pessoais e solicitações dos usuários
                </p>
                <Link
                  href="/admin/data-requests"
                  className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200"
                >
                  Gerenciar
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Rate Limiting</h3>
                <p className="text-gray-300 mb-4">
                  Estatísticas e configurações de rate limiting
                </p>
                <Link
                  href="/admin/rate-limiting"
                  className="block w-full text-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition duration-200"
                >
                  Configurar
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold mb-2">Ambiente</h3>
                <p className="text-gray-300 mb-4">
                  Validação de variáveis e configurações
                </p>
                <Link
                  href="/admin/environment"
                  className="block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition duration-200"
                >
                  Validar
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">Logs</h3>
                <p className="text-gray-300 mb-4">
                  Visualizar e analisar logs do sistema
                </p>
                <Link
                  href="/admin/logs"
                  className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200"
                >
                  Ver Logs
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Ações Rápidas</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleQuickAction('reload-stats')}
                disabled={loading}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition duration-200"
              >
                🔄 Recarregar Estatísticas
              </button>
              
              <button 
                onClick={() => handleQuickAction('reset-test-data')}
                disabled={loading}
                className="px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition duration-200"
              >
                🎲 Resetar Dados de Teste
              </button>
              
              <button 
                onClick={() => handleQuickAction('generate-report')}
                disabled={loading}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition duration-200"
              >
                📊 Gerar Relatório
              </button>
              
              <button 
                onClick={() => handleQuickAction('backup-system')}
                disabled={loading}
                className="px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg transition duration-200"
              >
                💾 Backup Sistema
              </button>
            </div>
          </div>

          {/* Admin Info */}
          <div className="mt-8 bg-green-500/10 border border-green-500 rounded-lg p-4 text-center">
            <div className="text-green-400 font-semibold mb-2">✅ Painel Administrativo Profissional</div>
            <p className="text-green-300 text-sm">
              Sistema com autenticação robusta, logs de auditoria, controle de permissões e funcionalidades completas de produção.
            </p>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}