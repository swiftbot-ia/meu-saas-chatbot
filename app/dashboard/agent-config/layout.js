import Sidebar from '../../components/Sidebar'
import { requireRole } from '@/lib/permission-check'

/**
 * Layout da Conta com Sidebar
 *
 * Este layout envolve todas as páginas dentro de /account/*
 * Fornece a sidebar expansível e o container principal, similar ao dashboard
 */
export default async function AccountLayout({ children }) {
    // Restrict access to owner and manager only
    await requireRole(['owner', 'manager']);

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content area with responsive padding */}
            <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
                <div className="min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    )
}
