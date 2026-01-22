import Sidebar from '../components/Sidebar'
import { requireRole } from '@/lib/permission-check'

export default async function SettingsLayout({ children }) {
    await requireRole(['owner', 'manager']);

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            <Sidebar />
            <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
                <div className="min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    )
}
