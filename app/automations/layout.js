'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import NoSubscription from '../components/NoSubscription'
import ConnectionDropdown from '@/app/components/ConnectionDropdown'
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

// ConnectionDropdown agora importado de @/app/components/ConnectionDropdown

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
                    // Use same localStorage key as other pages (contacts, chat)
                    const saved = localStorage.getItem('activeConnectionId')
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
        // Sync with other pages
        localStorage.setItem('activeConnectionId', connId)
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
