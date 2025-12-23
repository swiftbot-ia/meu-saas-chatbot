/**
 * Layout específico para Landing Pages
 * Otimizado para conversão e rastreamento de campanhas
 */

export const metadata = {
    robots: {
        index: true,
        follow: true,
    },
}

export default function LandingPageLayout({ children }) {
    return (
        <div className="min-h-screen bg-black">
            {children}
        </div>
    )
}
