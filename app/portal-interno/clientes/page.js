'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/portal-interno/auth/session')
      const data = await response.json()
      
      if (!data.success) {
        router.push('/portal-interno/login')
        return
      }
      
      setUser(data.user)
    } catch (error) {
      router.push('/portal-interno/login')
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/portal-interno/clientes/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setClients(data.clients)
        setSearched(true)
      }
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      setLoading(false)
    }
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Buscar Clientes</h1>
          <p className="text-gray-400">Pesquise por email, nome ou empresa</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite email, nome ou empresa..."
                className="w-full bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-[#04F5A0] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold rounded-xl transition-all"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">
                Resultados ({clients.length})
              </h2>
            </div>

            {clients.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => router.push(`/portal-interno/clientes/${client.id}`)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#04F5A0] flex items-center justify-center text-black font-bold">
                            {client.full_name?.[0] || client.email[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">
                              {client.full_name || 'Nome não definido'}
                            </h3>
                            <p className="text-sm text-gray-400">{client.email}</p>
                          </div>
                        </div>
                        
                        {client.company_name && (
                          <div className="ml-13 text-sm text-gray-500">
                            🏢 {client.company_name}
                          </div>
                        )}
                        
                        {client.is_super_account && (
                          <div className="ml-13 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Super Conta
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                          <div className="text-xs text-gray-500">Membro desde</div>
                          <div className="text-sm text-gray-300">
                            {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        <svg
                          className="w-5 h-5 text-gray-500 group-hover:text-[#04F5A0] transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}