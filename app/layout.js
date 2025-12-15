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

// JSON-LD Schemas para SEO
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SwiftBot",
  "url": "https://swiftbot.com.br",
  "logo": "https://swiftbot.com.br/LOGO-SWIFTBOT.png",
  "description": "Plataforma de automação de WhatsApp com Inteligência Artificial. Crie seu clone digital para atender clientes 24/7.",
  "sameAs": [
    "https://instagram.com/swiftbot.ia",
    "https://www.facebook.com/SwiftBott"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": ["Portuguese"]
  }
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SwiftBot",
  "operatingSystem": "Web",
  "applicationCategory": "BusinessApplication",
  "description": "Automação de WhatsApp com IA. Configure em minutos, atenda 24/7.",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "BRL",
    "lowPrice": "147",
    "highPrice": "297",
    "offerCount": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "5000",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "Chat ao vivo estilo WhatsApp",
    "IA treinada com suas conversas",
    "CRM visual com Kanban",
    "Gestão de contatos com tags",
    "Relatórios de análise",
    "Suporte 24/7"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SwiftBot",
  "url": "https://swiftbot.com.br",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://swiftbot.com.br/faq?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export const metadata = {
  metadataBase: new URL('https://swiftbot.com.br'),
  title: {
    default: "SwiftBot - Automação de WhatsApp com IA | Clone seu Atendimento",
    template: "%s | SwiftBot"
  },
  description: "Automatize seu WhatsApp com Inteligência Artificial. A SwiftBot cria um clone digital do seu melhor atendimento em 5 minutos. Atenda clientes 24/7 sem contratar funcionários. Teste grátis.",
  keywords: [
    "automação whatsapp",
    "chatbot whatsapp",
    "inteligência artificial atendimento",
    "bot whatsapp business",
    "automatizar whatsapp",
    "atendimento automático whatsapp",
    "ia para whatsapp",
    "clone digital atendimento",
    "swiftbot",
    "crm whatsapp",
    "gestão de leads whatsapp"
  ],
  authors: [{ name: "SwiftBot", url: "https://swiftbot.com.br" }],
  creator: "SwiftBot",
  publisher: "SwiftBot",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
    title: "SwiftBot - Automação de WhatsApp com IA",
    description: "Crie um clone digital do seu melhor atendimento em 5 minutos. Atenda clientes 24/7 com IA treinada nas suas conversas.",
    type: "website",
    locale: "pt_BR",
    url: "https://swiftbot.com.br",
    siteName: "SwiftBot",
    images: [
      {
        url: "/LOGO-SWIFTBOT.png",
        width: 1200,
        height: 630,
        alt: "SwiftBot - Automação de WhatsApp com IA"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftBot - Automação de WhatsApp com IA",
    description: "Clone seu atendimento com IA. Configure em 5 minutos, atenda 24/7.",
    images: ["/LOGO-SWIFTBOT.png"],
  },
  alternates: {
    canonical: "https://swiftbot.com.br",
  },
  category: "technology",
  classification: "Business Software",
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
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="msapplication-TileColor" content="#04F5A0" />

        {/* JSON-LD Schemas para SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
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
