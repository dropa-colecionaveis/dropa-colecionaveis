'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/hooks/useAdmin'

interface CreditPackage {
  id: string
  credits: number
  price: number
  isActive: boolean
  isPopular: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  _count?: {
    payments: number
  }
}

interface CreatePackageData {
  credits: number | ''
  price: number | ''
  isPopular: boolean
  displayOrder: number | ''
  isActive: boolean
}

export default function CreditPackagesAdmin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null)
  const [formData, setFormData] = useState<CreatePackageData>({
    credits: '',
    price: '',
    isPopular: false,
    displayOrder: '',
    isActive: true
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/credit-packages')
    } else if (status === 'authenticated' && !adminLoading) {
      if (!isAdmin) {
        alert('⚠️ Acesso negado! Esta área é restrita para administradores.')
        router.push('/admin')
      } else {
        fetchPackages()
      }
    }
  }, [status, router, isAdmin, adminLoading])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/credit-packages')
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
      } else {
        console.error('Failed to fetch packages')
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      credits: '',
      price: '',
      isPopular: false,
      displayOrder: '',
      isActive: true
    })
    setEditingPackage(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.credits || !formData.price) {
      alert('Preencha os campos obrigatórios')
      return
    }

    try {
      const url = editingPackage 
        ? `/api/admin/credit-packages/${editingPackage.id}`
        : '/api/admin/credit-packages'
      
      const method = editingPackage ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: Number(formData.credits),
          price: Number(formData.price),
          isPopular: formData.isPopular,
          displayOrder: Number(formData.displayOrder) || 0,
          isActive: formData.isActive
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(editingPackage ? 'Pacote atualizado com sucesso!' : 'Pacote criado com sucesso!')
        resetForm()
        fetchPackages()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao salvar o pacote')
      console.error('Error saving package:', error)
    }
  }

  const handleEdit = (pkg: CreditPackage) => {
    setEditingPackage(pkg)
    setFormData({
      credits: pkg.credits,
      price: pkg.price,
      isPopular: pkg.isPopular,
      displayOrder: pkg.displayOrder,
      isActive: pkg.isActive
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (pkg: CreditPackage) => {
    const hasPayments = pkg._count?.payments && pkg._count.payments > 0
    const message = hasPayments 
      ? `Este pacote tem ${pkg._count?.payments} pagamentos associados. Ele será desativado, não deletado. Continuar?`
      : 'Tem certeza que deseja deletar este pacote?'

    if (!confirm(message)) return

    try {
      const response = await fetch(`/api/admin/credit-packages/${pkg.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        fetchPackages()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao deletar o pacote')
      console.error('Error deleting package:', error)
    }
  }

  const toggleStatus = async (pkg: CreditPackage) => {
    try {
      const response = await fetch(`/api/admin/credit-packages/${pkg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !pkg.isActive
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Pacote ${!pkg.isActive ? 'ativado' : 'desativado'} com sucesso!`)
        fetchPackages()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao alterar status')
      console.error('Error toggling status:', error)
    }
  }

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/admin/credit-packages/clear-cache', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert('Cache limpo com sucesso! As alterações já devem aparecer na página de compra.')
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert('Erro ao limpar cache')
      console.error('Error clearing cache:', error)
    }
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
          <Link href="/admin" className="text-2xl font-bold text-white">
            💰 Gerenciar Pacotes de Créditos
          </Link>
          <div className="text-white">
            Admin: {session?.user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Pacotes de Créditos</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                title="Limpa o cache e força atualização na página de compra"
              >
                🔄 Atualizar Cache
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                ➕ Novo Pacote
              </button>
            </div>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingPackage ? 'Editar Pacote' : 'Criar Novo Pacote'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Créditos *
                    </label>
                    <input
                      type="number"
                      value={formData.credits}
                      onChange={(e) => setFormData({...formData, credits: Number(e.target.value) || ''})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300"
                      placeholder="Ex: 100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value) || ''})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300"
                      placeholder="Ex: 10.00"
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({...formData, displayOrder: Number(e.target.value) || ''})}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-white">Popular</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-white">Ativo</span>
                    </label>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    {editingPackage ? 'Atualizar' : 'Criar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Packages Table */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-medium">Créditos</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Preço (R$)</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Popular</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Ordem</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Pagamentos</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 text-white font-medium">{pkg.credits}</td>
                      <td className="px-4 py-3 text-green-400 font-medium">R$ {pkg.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pkg.isActive 
                            ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                            : 'bg-red-600/20 text-red-300 border border-red-500/30'
                        }`}>
                          {pkg.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {pkg.isPopular && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-600/20 text-yellow-300 border border-yellow-500/30">
                            Popular
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{pkg.displayOrder}</td>
                      <td className="px-4 py-3 text-gray-300">{pkg._count?.payments || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(pkg)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleStatus(pkg)}
                            className={`px-2 py-1 text-white text-xs rounded transition-colors ${
                              pkg.isActive
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {pkg.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDelete(pkg)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {packages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">Nenhum pacote encontrado</div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                Criar Primeiro Pacote
              </button>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition duration-200"
            >
              ← Voltar ao Admin
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}