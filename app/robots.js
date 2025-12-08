// app/robots.js
// Configura robots.txt para crawlers tradicionais e de IA

export default function robots() {
    const baseUrl = 'https://swiftbot.com.br'

    return {
        rules: [
            // Regra geral para todos os crawlers
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/dashboard/',
                    '/auth/',
                    '/portal-interno/',
                    '/account/',
                    '/settings/',
                    '/crm/',
                    '/contacts/',
                    '/chat/',
                    '/automations/',
                    '/complete-profile/',
                    '/reset-password/',
                    '/agent-config/',
                    '/swiftbot-ia/',
                ],
            },
            // OpenAI GPTBot - permite acesso ao conteúdo público
            {
                userAgent: 'GPTBot',
                allow: ['/', '/pricing', '/faq', '/terms', '/privacy', '/support', '/llms.txt'],
                disallow: ['/api/', '/dashboard/', '/auth/', '/portal-interno/'],
            },
            // Perplexity AI
            {
                userAgent: 'PerplexityBot',
                allow: ['/', '/pricing', '/faq', '/terms', '/privacy', '/support', '/llms.txt'],
                disallow: ['/api/', '/dashboard/', '/auth/', '/portal-interno/'],
            },
            // Google AI (Gemini, Bard, etc.)
            {
                userAgent: 'Google-Extended',
                allow: ['/', '/pricing', '/faq', '/terms', '/privacy', '/support', '/llms.txt'],
                disallow: ['/api/', '/dashboard/', '/auth/', '/portal-interno/'],
            },
            // Anthropic Claude
            {
                userAgent: 'anthropic-ai',
                allow: ['/', '/pricing', '/faq', '/terms', '/privacy', '/support', '/llms.txt'],
                disallow: ['/api/', '/dashboard/', '/auth/', '/portal-interno/'],
            },
            // ChatGPT User (quando usuários navegam via ChatGPT)
            {
                userAgent: 'ChatGPT-User',
                allow: ['/', '/pricing', '/faq', '/terms', '/privacy', '/support', '/llms.txt'],
                disallow: ['/api/', '/dashboard/', '/auth/', '/portal-interno/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
