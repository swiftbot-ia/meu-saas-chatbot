'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EquipePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkAuth()
    loadUsers()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/portal-interno/auth/session')
      const data = await response.json()
      
      if (!data.success) {
        router.push('/portal-interno/login')
        return
      }
      
      // Verificar permissão
      if (!['admin', 'gerente'].includes(data.user.role)) {
        router.push('/portal-interno/dashboard')
        return
      }
      
      setUser(data.user)
    } catch (error) {
      router.push('/portal-interno/login')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/portal-interno/equipe/list')
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Erro ao carregar equipe:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch('/api/portal-interno/equipe/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus })
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`)
        loadUsers()
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(data.error)
        setTimeout(() => setErrorMessage(''), 3000)
      }
    } catch (error) {
      setErrorMessage('Erro ao alterar status')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return

    try {
      const response = await fetch(`/api/portal-interno/equipe/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage('Usuário removido com sucesso')
        loadUsers()
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(data.error)
        setTimeout(() => setErrorMessage(''), 3000)
      }
    } catch (error) {
      setErrorMessage('Erro ao remover usuário')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04F5A0]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/portal-interno/dashboard')}
              className="flex items-center text-gray-300 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Dashboard
            </button>

            <div className="text-right">
              <div className="text-sm font-medium text-white">{user?.full_name}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-400">
            ✅ {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
            ❌ {errorMessage}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Equipe</h1>
            <p className="text-gray-400">Gerencie os usuários da equipe de suporte</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#04F5A0] hover:bg-[#03E691] text-black font-bold rounded-xl transition-all flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Usuário
          </button>
        </div>

        {/* Users List */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Último Login</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#04F5A0] flex items-center justify-center text-black font-bold">
                          {u.full_name[0]}
                        </div>
                        <div>
                          <div className="text-white font-medium">{u.full_name}</div>
                          <div className="text-sm text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        u.role === 'gerente' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm ${
                        u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          disabled={u.id === user?.id}
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 disabled:cursor-not-allowed text-blue-400 disabled:text-gray-500 rounded-lg text-sm"
                        >
                          {u.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={u.id === user?.id}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-500/20 disabled:cursor-not-allowed text-red-400 disabled:text-gray-500 rounded-lg text-sm"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadUsers()
            setSuccessMessage('Usuário criado com sucesso')
            setTimeout(() => setSuccessMessage(''), 3000)
          }}
          currentUserRole={user?.role}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess, currentUserRole }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.target)
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      full_name: formData.get('full_name'),
      role: formData.get('role')
    }

    try {
      const response = await fetch('/api/portal-interno/equipe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Adicionar Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
            <input
              type="text"
              name="full_name"
              required
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              name="role"
              required
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Selecione...</option>
              <option value="suporte">Suporte</option>
              {currentUserRole === 'admin' && (
                <>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Admin</option>
                </>
              )}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold rounded-xl"
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}