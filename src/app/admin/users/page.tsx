'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'

interface User {
  id: string
  name: string | null
  email: string
  credits: number
  createdAt: string
  _count: {
    packOpenings: number
    userItems: number
  }
}

export default function AdminUsers() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, isLoading: adminLoading } = useAdmin()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [credits, setCredits] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/users')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/dashboard')
      } else {
        fetchUsers()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCredits = async () => {
    if (!selectedUser || !credits) return

    try {
      const response = await fetch('/api/admin/users/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          credits: parseInt(credits)
        })
      })

      if (response.ok) {
        alert(`✅ ${credits} créditos adicionados para ${selectedUser.name || selectedUser.email}!`)
        setShowModal(false)
        setCredits('')
        fetchUsers()
      } else {
        alert('❌ Erro ao adicionar créditos')
      }
    } catch (error) {
      console.error('Error adding credits:', error)
      alert('❌ Erro ao adicionar créditos')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || adminLoading || loading) {
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
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-2xl font-bold text-white">
              Admin Panel
            </Link>
            <span className="text-gray-400">→</span>
            <span className="text-white">Gerenciar Usuários</span>
          </div>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Gerenciar Usuários</h1>
            <div className="text-gray-300">
              Total: {users.length} usuários
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr className="text-white">
                    <th className="px-6 py-4 text-left">Usuário</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-center">Créditos</th>
                    <th className="px-6 py-4 text-center">Pacotes</th>
                    <th className="px-6 py-4 text-center">Itens</th>
                    <th className="px-6 py-4 text-center">Cadastro</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`text-white ${index % 2 === 0 ? 'bg-white/5' : 'bg-transparent'} hover:bg-white/10 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{user.name || 'Sem nome'}</div>
                            {(user.email === 'admin@admin.com' || user.email === 'superadmin@admin.com') && (
                              <div className="text-orange-400 text-xs">
                                {user.email === 'superadmin@admin.com' ? '👑 SUPER ADMIN' : '🔧 ADMIN'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-yellow-400 font-semibold">{user.credits}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-400">
                        {user._count.packOpenings}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-400">
                        {user._count.userItems}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-400 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowModal(true)
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition duration-200"
                        >
                          💰 Créditos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-300">
              Nenhum usuário encontrado.
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Painel Admin
            </Link>
          </div>
        </div>
      </main>

      {/* Modal for Adding Credits */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Adicionar Créditos
            </h3>
            <p className="text-gray-300 mb-4">
              Usuário: <span className="text-white font-semibold">
                {selectedUser.name || selectedUser.email}
              </span>
            </p>
            <p className="text-gray-300 mb-4">
              Créditos atuais: <span className="text-yellow-400 font-semibold">
                {selectedUser.credits}
              </span>
            </p>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Créditos para adicionar:</label>
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 100"
                min="1"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddCredits}
                disabled={!credits}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded transition duration-200"
              >
                ✅ Adicionar
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setCredits('')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}