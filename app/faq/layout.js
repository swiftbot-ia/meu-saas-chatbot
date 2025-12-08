// app/faq/layout.js
// Metadata específica para a página de FAQ

export const metadata = {
    title: "Perguntas Frequentes - FAQ",
    description: "Tire suas dúvidas sobre a SwiftBot. Saiba como funciona o teste grátis, planos, segurança, configuração e tecnologia de IA para automação de WhatsApp.",
    keywords: [
        "swiftbot faq",
        "perguntas frequentes chatbot whatsapp",
        "como funciona automação whatsapp",
        "teste grátis swiftbot",
        "segurança chatbot whatsapp",
        "preços automação whatsapp"
    ],
    openGraph: {
        title: "FAQ - SwiftBot | Automação de WhatsApp com IA",
        description: "Tire suas dúvidas sobre automação de WhatsApp com IA. Teste grátis, planos, configuração e mais.",
        url: "https://swiftbot.com.br/faq",
    },
    alternates: {
        canonical: "https://swiftbot.com.br/faq",
    },
}

export default function FAQLayout({ children }) {
    return children
}
