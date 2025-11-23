'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Bot,
  BarChart3,
  Settings,
  Menu,
  X,
  UserCog,
  CreditCard,
  Lightbulb,
  HelpCircle,
  LogOut,
  Zap
} from 'lucide-react'

/**
 * Sidebar Consolidada para Dashboard
 *
 * Features:
 * - Navegação primária (Dashboard, Contatos, Chat ao vivo, etc.)
 * - Navegação de conta (Perfil, Assinatura, Suporte, etc.)
 * - Logo e identidade SwiftBot
 * - Expansível/colapsável com persistência
 * - Responsivo com overlay em mobile
 * - Logout integrado
 */
export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // ============================================================================
  // NAVEGAÇÃO PRIMÁRIA
  // ============================================================================
  const primaryMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/dashboard',
      badge: null
    },
    {
      icon: Users,
      label: 'Contatos',
      href: '/dashboard/contacts',
      badge: '🚧'
    },
    {
      icon: MessageCircle,
      label: 'Chat ao vivo',
      href: '/dashboard/chat',
      badge: '🚧'
    },
    {
      icon: Bot,
      label: 'Automações',
      href: '/dashboard/automations',
      badge: '🚧'
    },
    {
      icon: BarChart3,
      label: 'Relatórios',
      href: '/dashboard/reports',
      badge: '🚧'
    },
    {
      icon: Settings,
      label: 'Configurações',
      href: '/dashboard/settings',
      badge: '🚧'
    }
  ]

  // ============================================================================
  // NAVEGAÇÃO DE CONTA
  // ============================================================================
  const accountMenuItems = [
    {
      icon: UserCog,
      label: 'Configurar Conta',
      href: '/account/profile',
      badge: null
    },
    {
      icon: CreditCard,
      label: 'Gerenciar Assinatura',
      href: '/account/subscription',
      badge: null
    },
    {
      icon: Lightbulb,
      label: 'Central de Sugestões',
      href: '/sugestao',
      badge: null
    },
    {
      icon: HelpCircle,
      label: 'Central de Ajuda',
      href: '/suporte',
      badge: null
    }
  ]

  // ============================================================================
  // MOBILE & EXPANDED STATE
  // ============================================================================
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // On mobile, start collapsed
      if (mobile) {
        setExpanded(false)
      } else {
        // On desktop, load from localStorage
        const savedState = localStorage.getItem('sidebar-expanded')
        if (savedState !== null) {
          setExpanded(JSON.parse(savedState))
        }
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save expanded state to localStorage (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-expanded', JSON.stringify(expanded))
    }
  }, [expanded, isMobile])

  // ============================================================================
  // HELPERS
  // ============================================================================
  const toggleSidebar = () => {
    setExpanded(!expanded)
  }

  const handleMenuItemClick = () => {
    if (isMobile) {
      setExpanded(false)
    }
  }

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // ============================================================================
  // LOGOUT
  // ============================================================================
  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && expanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-[#1F1F1F] z-50
          transition-all duration-300 ease-in-out
          ${expanded ? 'w-[280px]' : 'w-[80px]'}
          ${isMobile && !expanded ? '-translate-x-full' : 'translate-x-0'}
          flex flex-col
        `}
      >
        {/* ====================================================================
            HEADER: Logo + Toggle
        ==================================================================== */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          {expanded ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00FF99] to-[#00E88C] rounded-lg flex items-center justify-center">
                  <Zap size={20} className="text-black" />
                </div>
                <span className="text-white font-bold text-lg">SwiftBot</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Colapsar sidebar"
              >
                <X size={24} />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors mx-auto"
              aria-label="Expandir sidebar"
            >
              <Menu size={24} />
            </button>
          )}
        </div>

        {/* ====================================================================
            NAVEGAÇÃO PRIMÁRIA
        ==================================================================== */}
        <nav className="flex-1 overflow-y-auto py-6">
          {/* Primary Menu */}
          <div className="px-3 mb-4">
            {expanded && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Navegação
              </h3>
            )}
            <ul className="space-y-2">
              {primaryMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleMenuItemClick}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-lg
                        transition-all duration-200
                        ${active
                          ? 'bg-[#00FF99]/10 border-l-4 border-[#00FF99] text-[#00FF99]'
                          : 'text-gray-400 hover:bg-[#272727] hover:text-white'
                        }
                        ${!expanded && 'justify-center'}
                      `}
                    >
                      <Icon size={20} className="flex-shrink-0" />

                      {expanded && (
                        <>
                          <span className="flex-1 text-sm font-medium">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="text-xs">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Divider */}
          <div className="mx-6 my-4 border-t border-gray-700"></div>

          {/* Account Menu */}
          <div className="px-3">
            {expanded && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Conta
              </h3>
            )}
            <ul className="space-y-2">
              {accountMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleMenuItemClick}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-lg
                        transition-all duration-200
                        ${active
                          ? 'bg-[#00FF99]/10 border-l-4 border-[#00FF99] text-[#00FF99]'
                          : 'text-gray-400 hover:bg-[#272727] hover:text-white'
                        }
                        ${!expanded && 'justify-center'}
                      `}
                    >
                      <Icon size={20} className="flex-shrink-0" />

                      {expanded && (
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}

              {/* Logout Button */}
              <li>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg
                    text-red-400 hover:bg-red-500/10 hover:text-red-300
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${!expanded && 'justify-center'}
                  `}
                >
                  <LogOut size={20} className="flex-shrink-0" />

                  {expanded && (
                    <span className="flex-1 text-sm font-medium text-left">
                      {loggingOut ? 'Saindo...' : 'Sair da Conta'}
                    </span>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* ====================================================================
            FOOTER
        ==================================================================== */}
        <div className="border-t border-gray-700 p-4">
          {expanded ? (
            <div className="text-center text-xs text-gray-500">
              <p className="font-medium">SwiftBot v1.0</p>
              <p className="mt-1">© 2025</p>
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500">
              <p>v1.0</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile toggle button (only visible on mobile when sidebar is collapsed) */}
      {isMobile && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="fixed bottom-6 left-6 z-40 bg-[#00FF99] text-black p-4 rounded-full shadow-lg md:hidden hover:bg-[#00E88C] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
      )}
    </>
  )
}
