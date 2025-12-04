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
  Zap,
  Trello
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
  const [isHovering, setIsHovering] = useState(false)

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
      icon: Trello,
      label: 'CRM',
      href: '/dashboard/sales-funnel',
      badge: null
    },
    {
      icon: Users,
      label: 'Contatos',
      href: '/dashboard/contacts',
      badge: null
    },
    {
      icon: MessageCircle,
      label: 'Chat ao vivo',
      href: '/dashboard/chat',
      badge: null
    },
    {
      icon: Bot,
      label: 'Automações',
      href: '/dashboard/automations',
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

  // Auto-collapse sidebar on route change
  useEffect(() => {
    setExpanded(false)
    setIsHovering(false)
  }, [pathname])

  // ============================================================================
  // HELPERS
  // ============================================================================
  const toggleSidebar = () => {
    setExpanded(!expanded)
  }

  const handleMenuItemClick = () => {
    // Auto-collapse sidebar on navigation for all devices
    setExpanded(false)
    setIsHovering(false)
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
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
        className={`
          fixed left-0 top-0 h-full bg-[#1F1F1F] z-50
          transition-all duration-500 ease-in-out
          ${(expanded || isHovering) ? 'w-[280px]' : 'w-[80px]'}
          ${isMobile && !expanded ? '-translate-x-full' : 'translate-x-0'}
          flex flex-col overflow-hidden
        `}
      >
        {/* ====================================================================
            HEADER: Logo + Toggle
        ==================================================================== */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          {isMobile ? (
            expanded ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex w-10 h-10 items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#00FF99" />
                      <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#00FF99" stroke="#00FF99" strokeWidth="1" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">SwiftBot</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Fechar sidebar"
                >
                  <X size={24} />
                </button>
              </>
            ) : null
          ) : (
            (expanded || isHovering) ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex w-10 h-10 items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#00FF99" />
                      <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.100,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#00FF99" stroke="#00FF99" strokeWidth="1" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">SwiftBot</span>
                </div>
                {expanded && !isHovering && (
                  <button
                    onClick={toggleSidebar}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Recolher sidebar"
                  >
                    <Menu size={24} />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white transition-colors mx-auto"
                aria-label="Fixar sidebar"
              >
                <Menu size={24} />
              </button>
            )
          )}
        </div>

        {/* ====================================================================
            NAVEGAÇÃO PRIMÁRIA
        ==================================================================== */}
        <style jsx>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <nav className="flex-1 overflow-y-auto py-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Primary Menu */}
          <div className="px-3 mb-4">
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 transition-opacity duration-300 ${(expanded || isHovering) ? 'opacity-100' : 'opacity-0'}`}>
              Navegação
            </h3>
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
                      `}
                    >
                      <Icon size={20} className="flex-shrink-0" />

                      <div className={`flex-1 flex items-center justify-between overflow-hidden transition-all duration-300 ${(expanded || isHovering) ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-xs whitespace-nowrap">
                            {item.badge}
                          </span>
                        )}
                      </div>
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
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 transition-opacity duration-300 ${(expanded || isHovering) ? 'opacity-100' : 'opacity-0'}`}>
              Conta
            </h3>
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
                        ${!(expanded || isHovering) && 'justify-center'}
                      `}
                    >
                      <Icon size={20} className="flex-shrink-0" />

                      <span className={`flex-1 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${(expanded || isHovering) ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* ====================================================================
            FOOTER: Logout Button + Version Info
        ==================================================================== */}
        <div className="border-t border-gray-700 p-4 space-y-3">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-lg
              text-red-400 hover:bg-red-500/10 hover:text-red-300
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <LogOut size={20} className="flex-shrink-0" />

            <span className={`flex-1 text-sm font-medium text-left whitespace-nowrap overflow-hidden transition-all duration-300 ${(expanded || isHovering) ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
              {loggingOut ? 'Saindo...' : 'Sair da Conta'}
            </span>
          </button>

          {/* Version Info */}
          {(expanded || isHovering) ? (
            <div className="text-center text-xs text-gray-500">
              <p className="font-medium">SwiftBot v1.78</p>
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
