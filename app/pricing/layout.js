// app/pricing/layout.js
// Metadata específica para a página de Preços

export const metadata = {
    title: "Preços e Planos",
    description: "Conheça os planos SwiftBot para automação de WhatsApp com IA. A partir de R$148/mês. Teste grátis por 4 dias. Sem limite de mensagens. Configure em 5 minutos.",
    keywords: [
        "preços swiftbot",
        "planos chatbot whatsapp",
        "quanto custa automação whatsapp",
        "chatbot whatsapp preço",
        "bot whatsapp mensal",
        "automação whatsapp barato"
    ],
    openGraph: {
        title: "Preços - SwiftBot | Automação de WhatsApp com IA",
        description: "Planos a partir de R$148/mês. Teste grátis por 4 dias. Sem limite de mensagens.",
        url: "https://swiftbot.com.br/pricing",
    },
    alternates: {
        canonical: "https://swiftbot.com.br/pricing",
    },
}

export default function PricingLayout({ children }) {
    return children
}
