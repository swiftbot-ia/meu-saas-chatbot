import Sidebar from '../components/Sidebar'

export default function SettingsLayout({ children }) {
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
