// import { Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from '../components/CookieConsent'

// Temporariamente desabilitado para evitar erros de fetch do Google Fonts
// Usando fonte do sistema como fallback
// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
//   weight: ["300", "400", "500", "600", "700", "800", "900"]
// });

const inter = {
  variable: "--font-inter",
  className: "font-sans"
};

export const metadata = {
  title: "SwiftBot",
  description: "Revolucione seu WhatsApp com Inteligência Artificial. Configure em minutos, funcione 24/7. A solução completa para automatizar seu atendimento.",
  keywords: "chatbot, whatsapp, inteligencia artificial, automação, atendimento, bot, ia, swift",
  authors: [{ name: "SwiftBot" }],
  creator: "SwiftBot",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "SwiftBot",
    description: "Revolucione seu WhatsApp com Inteligência Artificial. Configure em minutos, funcione 24/7.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftBot",
    description: "Revolucione seu WhatsApp com Inteligência Artificial. Configure em minutos, funcione 24/7.",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#04F5A0',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <meta name="msapplication-TileColor" content="#04F5A0" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`} suppressHydrationWarning>
        <div className="min-h-screen">
          {children}
          <CookieConsent />
        </div>
      </body>
    </html>
  );
}