'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Mail,
  Bot,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react'

/**
 * Sidebar Expansível para Dashboard
 *
 * Features:
 * - Largura expansível/colapsável com animação suave
 * - Persistência de estado em localStorage
 * - Menu items com ícones e badges
 * - Destaque de rota ativa
 * - Responsivo: colapsado por padrão em mobile com overlay
 */
export default function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Menu items configuration
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/dashboard',
      badge: null
    },
    {
      icon: MessageSquare,
      label: 'Instâncias',
      href: '/dashboard/instances',
      badge: null
    },
    {
      icon: Users,
      label: 'Contatos',
      href: '/dashboard/contacts',
      badge: '🚧'
    },
    {
      icon: Mail,
      label: 'Mensagens',
      href: '/dashboard/messages',
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
      badge: null
    }
  ]

  // Load expanded state from localStorage and check if mobile
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

  // Toggle sidebar
  const toggleSidebar = () => {
    setExpanded(!expanded)
  }

  // Close sidebar on mobile when clicking a menu item
  const handleMenuItemClick = () => {
    if (isMobile) {
      setExpanded(false)
    }
  }

  // Check if route is active
  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
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
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with toggle button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            {expanded ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00FF99] to-[#00E88C] rounded-lg flex items-center justify-center">
                    <span className="text-xl">⚡</span>
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

          {/* Menu items */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-2 px-3">
              {menuItems.map((item) => {
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
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-700 p-4">
            {expanded ? (
              <div className="text-center text-xs text-gray-500">
                <p>SwiftBot v1.0</p>
                <p className="mt-1">© 2025</p>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500">
                <p>v1.0</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile toggle button (only visible on mobile when sidebar is collapsed) */}
      {isMobile && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="fixed bottom-6 left-6 z-40 bg-[#00FF99] text-black p-4 rounded-full shadow-lg md:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
      )}
    </>
  )
}
