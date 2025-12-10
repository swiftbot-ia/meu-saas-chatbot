'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '../components/Header'

// Componente interno que usa useSearchParams
function DataDeletionStatusContent() {
    const searchParams = useSearchParams()
    const codeFromUrl = searchParams.get('code')

    const [confirmationCode, setConfirmationCode] = useState(codeFromUrl || '')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    // Auto-search if code is in URL
    useEffect(() => {
        if (codeFromUrl) {
            handleSearch()
        }
    }, [codeFromUrl])

    const handleSearch = async () => {
        if (!confirmationCode.trim()) {
            setError('Por favor, insira o código de confirmação')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch(`/api/facebook/data-deletion-status?code=${encodeURIComponent(confirmationCode.trim())}`)
            const data = await response.json()

            if (!data.found) {
                setError('Solicitação não encontrada. Verifique o código e tente novamente.')
            } else {
                setResult(data)
            }
        } catch (err) {
            setError('Erro ao verificar status. Tente novamente mais tarde.')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleString('pt-BR', {
            dateStyle: 'long',
            timeStyle: 'short'
        })
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200'
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'partial': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'failed': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            case 'processing':
                return (
                    <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                )
            case 'pending':
                return (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            case 'failed':
                return (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
        }
    }

    return (
        <div className="min-h-screen bg-black text-gray-700 relative overflow-x-hidden">
            <Header />

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="py-20 relative overflow-hidden bg-black">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black/50 to-black" />

                    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="text-center mb-12">
                            <div className="inline-block bg-white/5 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
                                <span className="text-purple-400 font-semibold text-sm">🔒 LGPD Compliant</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-light text-white mb-4 leading-tight">
                                Status da <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">Exclusão de Dados</span>
                            </h1>
                            <p className="text-gray-400 text-lg max-w-xl mx-auto">
                                Verifique o status da sua solicitação de exclusão de dados pessoais.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Content Section */}
                <section className="py-16 bg-[#E1DFDB] rounded-t-[40px] md:rounded-t-[80px] relative overflow-visible -mt-16 md:-mt-20">
                    <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

                        {/* Search Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
                            <h2 className="text-xl font-semibold text-black mb-6 flex items-center gap-3">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                Verificar Status
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código de Confirmação
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmationCode}
                                        onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                                        placeholder="Ex: DEL-A1B2C3D4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black font-mono"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>

                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Verificar Status
                                        </>
                                    )}
                                </button>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result Card */}
                        {result && (
                            <div className="bg-white rounded-3xl p-8 shadow-lg">
                                <div className="flex items-center gap-4 mb-6">
                                    {getStatusIcon(result.status)}
                                    <div>
                                        <h3 className="text-lg font-semibold text-black">
                                            Solicitação Encontrada
                                        </h3>
                                        <p className="text-gray-500 text-sm font-mono">
                                            {result.confirmationCode}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border mb-6 ${getStatusColor(result.status)}`}>
                                    {result.statusLabel}
                                </div>

                                {/* Details */}
                                <div className="space-y-4">
                                    <div className="flex justify-between py-3 border-b border-gray-100">
                                        <span className="text-gray-600">Data da Solicitação</span>
                                        <span className="text-black font-medium">{formatDate(result.requestedAt)}</span>
                                    </div>

                                    {result.processedAt && (
                                        <div className="flex justify-between py-3 border-b border-gray-100">
                                            <span className="text-gray-600">Início do Processamento</span>
                                            <span className="text-black font-medium">{formatDate(result.processedAt)}</span>
                                        </div>
                                    )}

                                    {result.completedAt && (
                                        <div className="flex justify-between py-3 border-b border-gray-100">
                                            <span className="text-gray-600">Conclusão</span>
                                            <span className="text-black font-medium">{formatDate(result.completedAt)}</span>
                                        </div>
                                    )}

                                    {result.summary && (
                                        <>
                                            <div className="flex justify-between py-3 border-b border-gray-100">
                                                <span className="text-gray-600">Categorias de Dados Excluídos</span>
                                                <span className="text-green-600 font-medium">{result.summary.tablesDeleted}</span>
                                            </div>

                                            {result.summary.tablesRetained > 0 && (
                                                <div className="flex justify-between py-3 border-b border-gray-100">
                                                    <span className="text-gray-600">Categorias Mantidas (Obrigação Legal)</span>
                                                    <span className="text-orange-600 font-medium">{result.summary.tablesRetained}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Retention Notice */}
                                {result.summary?.retentionReason && (
                                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div>
                                                <p className="text-yellow-800 text-sm font-medium">Dados Retidos por Obrigação Legal</p>
                                                <p className="text-yellow-700 text-sm mt-1">
                                                    {result.summary.retentionReason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info Card */}
                        <div className="mt-8 bg-gray-50 rounded-2xl p-6 text-sm text-gray-600">
                            <h4 className="font-semibold text-gray-800 mb-3">Sobre a Exclusão de Dados</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">•</span>
                                    <span>A exclusão é processada imediatamente após a solicitação.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">•</span>
                                    <span>Alguns dados podem ser mantidos por obrigação legal (LGPD Art. 16, II).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">•</span>
                                    <span>Dados fiscais são retidos por 5 anos conforme CTN Art. 173.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600">•</span>
                                    <span>Dúvidas? Entre em contato: <a href="mailto:privacidade@swiftbot.com.br" className="text-green-600 hover:underline">privacidade@swiftbot.com.br</a></span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="relative z-10 bg-black border-t border-white/10 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">
                        © 2025 SwiftBot. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}

// Loading fallback para o Suspense
function LoadingFallback() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <svg className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-400">Carregando...</p>
            </div>
        </div>
    )
}

// Componente exportado com Suspense boundary
export default function DataDeletionStatusPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <DataDeletionStatusContent />
        </Suspense>
    )
}
