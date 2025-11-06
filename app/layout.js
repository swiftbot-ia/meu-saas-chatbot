import { Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from '../components/CookieConsent'


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"]
});

export const metadata = {
  title: "SwiftBot - Chatbot WhatsApp com IA",
  description: "Revolucione seu WhatsApp com Inteligência Artificial. Configure em minutos, funcione 24/7. A solução completa para automatizar seu atendimento.",
  keywords: "chatbot, whatsapp, inteligencia artificial, automação, atendimento, bot, ia, swift",
  authors: [{ name: "SwiftBot" }],
  creator: "SwiftBot",
  openGraph: {
    title: "SwiftBot - Chatbot WhatsApp com IA",
    description: "Revolucione seu WhatsApp com Inteligência Artificial. Configure em minutos, funcione 24/7.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftBot - Chatbot WhatsApp com IA",
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
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <meta name="msapplication-TileColor" content="#04F5A0" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        <div className="min-h-screen">
          {children}
          <CookieConsent />
        </div>
      </body>
    </html>
  );
}