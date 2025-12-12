'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import NoSubscription from '../components/NoSubscription'
import {
    Bot,
    Clock,
    ChevronDown,
    MessageCircle,
    Hash
} from 'lucide-react'

// ============================================================================
// CONTEXT PARA COMPARTILHAR ESTADO ENTRE TABS
// ============================================================================
const AutomationsContext = createContext()

export function useAutomations() {
    return useContext(AutomationsContext)
}

// ============================================================================
// CONNECTION DROPDOWN - Padrão do Chat
// ============================================================================
const ConnectionDropdown = ({ connections, selectedConnection, onSelectConnection }) => {
    const [isOpen, setIsOpen] = useState(false)
    const selected = connections.find(c => c.id === selectedConnection)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 bg-[#1E1E1E] px-4 py-3 rounded-2xl hover:bg-[#252525] transition-all"
            >
                <div className="flex items-center gap-3">
                    {selected?.profile_pic_url ? (
                        <img src={selected.profile_pic_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00FF99] to-[#00E88C] flex items-center justify-center">
                            <span className="text-black text-lg font-bold">{selected?.contact_name?.[0] || 'W'}</span>
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-white font-semibold">{selected?.contact_name || 'Selecionar'}</p>
                        <p className={`text-sm ${selected?.is_connected ? 'text-[#00FF99]' : 'text-gray-500'}`}>
                            ● {selected?.is_connected ? 'Conectado' : 'Desconectado'}
                        </p>
                    </div>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1E1E] rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto border border-white/10">
                        {connections.map(conn => (
                            <button
                                key={conn.id}
                                onClick={() => { onSelectConnection(conn.id); setIsOpen(false) }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl
                                    ${selectedConnection === conn.id
                                        ? 'bg-[#00FF99]/10'
                                        : 'hover:bg-white/5'}`}
                            >
                                {conn.profile_pic_url ? (
                                    <img src={conn.profile_pic_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00FF99] to-[#00E88C] flex items-center justify-center">
                                        <span className="text-black text-lg font-bold">{conn.contact_name?.[0] || 'W'}</span>
                                    </div>
                                )}
                                <div className="text-left flex-1">
                                    <p className={`font-semibold ${selectedConnection === conn.id ? 'text-[#00FF99]' : 'text-white'}`}>
                                        {conn.contact_name || conn.instance_name}
                                    </p>
                                    <p className={`text-sm ${conn.is_connected ? 'text-[#00FF99]' : 'text-gray-500'}`}>
                                        ● {conn.is_connected ? 'Conectado' : 'Desconectado'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// ============================================================================
// TAB NAVIGATION COM LINKS
// ============================================================================
const TabNavigation = () => {
    const pathname = usePathname()

    const tabs = [
        { id: 'templates', label: 'Meus Templates', icon: MessageCircle, href: '/automations/templates' },
        { id: 'keywords', label: 'Palavras-chave', icon: Hash, href: '/automations/keywords' },
        { id: 'sequences', label: 'Sequências', icon: Clock, href: '/automations/sequences' }
    ]

    return (
        <div className="flex gap-2 border-b border-white/10">
            {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[2px]
              ${isActive ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}`}
                    >
                        <Icon size={16} />
                        {tab.label}
                    </Link>
                )
            })}
        </div>
    )
}

// ============================================================================
// LAYOUT PRINCIPAL
// ============================================================================
export default function AutomationsLayout({ children }) {
    const router = useRouter()
    const pathname = usePathname()

    const [loading, setLoading] = useState(true)
    const [subscription, setSubscription] = useState(null)
    const [subscriptionChecked, setSubscriptionChecked] = useState(false)
    const [connections, setConnections] = useState([])
    const [selectedConnection, setSelectedConnection] = useState(null)
    const [ownerUserId, setOwnerUserId] = useState(null)

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push('/login'); return }

                let ownerId = user.id
                try {
                    const accountResponse = await fetch('/api/account/team')
                    const accountData = await accountResponse.json()
                    if (accountData.success && accountData.account) {
                        const owner = accountData.members?.find(m => m.role === 'owner')
                        if (owner) ownerId = owner.userId
                    }
                } catch (e) { console.log('Account check failed:', e) }
                setOwnerUserId(ownerId)

                const { data: subData } = await supabase
                    .from('user_subscriptions')
                    .select('*')
                    .eq('user_id', ownerId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (subData) {
                    const isActive = ['active', 'trial', 'trialing'].includes(subData.status) || subData.stripe_subscription_id === 'super_account_bypass'
                    const isExpired = subData.trial_end_date && new Date() > new Date(subData.trial_end_date)
                    if (isActive && !isExpired) setSubscription(subData)
                }
                setSubscriptionChecked(true)

                const { data: conns } = await supabase
                    .from('whatsapp_connections')
                    .select('*')
                    .eq('user_id', ownerId)
                    .order('created_at', { ascending: false })

                if (conns && conns.length > 0) {
                    setConnections(conns)
                    const saved = localStorage.getItem('automations-connection')
                    if (saved && conns.find(c => c.id === saved)) {
                        setSelectedConnection(saved)
                    } else {
                        setSelectedConnection(conns[0].id)
                    }
                }
            } catch (error) {
                console.error('Init error:', error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    const handleConnectionSelect = (connId) => {
        setSelectedConnection(connId)
        localStorage.setItem('automations-connection', connId)
    }

    // Redirect to templates if on base path
    useEffect(() => {
        if (pathname === '/automations' && !loading) {
            router.replace('/automations/templates')
        }
    }, [pathname, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A]">
                <Sidebar />
                <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
                    </div>
                </main>
            </div>
        )
    }

    if (subscriptionChecked && !subscription) {
        return (
            <div className="min-h-screen bg-[#0A0A0A]">
                <Sidebar />
                <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
                    <NoSubscription />
                </main>
            </div>
        )
    }

    if (connections.length === 0) {
        return (
            <div className="min-h-screen bg-[#0A0A0A]">
                <Sidebar />
                <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <Bot className="text-gray-600 mx-auto mb-4" size={64} />
                            <h2 className="text-2xl font-bold text-white mb-2">Nenhuma conexão WhatsApp</h2>
                            <p className="text-gray-400 mb-6">Conecte uma instância do WhatsApp para criar automações.</p>
                            <a href="/dashboard" className="inline-block bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all">
                                Ir para Dashboard
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    const contextValue = { connections, selectedConnection, ownerUserId, subscription }

    return (
        <AutomationsContext.Provider value={contextValue}>
            <div className="min-h-screen bg-[#0A0A0A]">
                <Sidebar />
                <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
                    <div className="min-h-screen">
                        {/* Header */}
                        <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5">
                            <div className="max-w-7xl mx-auto px-6 py-4">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <Bot className="text-[#00FF99]" size={28} />
                                        <h1 className="text-2xl font-bold text-white">Automações</h1>
                                    </div>
                                    <div className="w-64">
                                        <ConnectionDropdown
                                            connections={connections}
                                            selectedConnection={selectedConnection}
                                            onSelectConnection={handleConnectionSelect}
                                        />
                                    </div>
                                </div>
                                <TabNavigation />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-w-7xl mx-auto px-6 py-6">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </AutomationsContext.Provider>
    )
}
