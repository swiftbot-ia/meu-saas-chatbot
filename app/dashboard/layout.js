'use client' // Necessário para usar usePathname

import { usePathname } from 'next/navigation'
import Sidebar from '../components/Sidebar'

/**
 * Layout do Dashboard
 * * Verifica a rota atual para decidir se exibe a Sidebar.
 * Remove a Sidebar especificamente na rota /dashboard/swiftbot-pro
 */
export default function DashboardLayout({ children }) {
  const pathname = usePathname()

  // Verifica se estamos na página do SwiftBot Pro (ou sub-rotas dela)
  const isSwiftBotPro = pathname?.startsWith('/dashboard/swiftbot-pro')

  // Se for SwiftBot Pro, retorna apenas o container e o conteúdo, sem Sidebar
  if (isSwiftBotPro) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        {children}
      </div>
    )
  }

  // Layout padrão para todas as outras páginas do dashboard
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Sidebar - Renderizada apenas se NÃO for swiftbot-pro */}
      <Sidebar />

      {/* Área principal com padding responsivo para compensar a Sidebar */}
      <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}