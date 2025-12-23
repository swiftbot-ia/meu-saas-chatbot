import { NextResponse } from 'next/server'

/**
 * POST /api/lp/register
 * Registra um lead da landing page
 */
export async function POST(request) {
    try {
        const { whatsapp, email, utmParams, source } = await request.json()

        if (!whatsapp || !email) {
            return NextResponse.json(
                { success: false, error: 'WhatsApp e email são obrigatórios' },
                { status: 400 }
            )
        }

        // Limpa o número
        const cleanWhatsapp = whatsapp.replace(/\D/g, '')

        // Prepara dados do lead
        const leadData = {
            whatsapp: cleanWhatsapp,
            email: email.trim().toLowerCase(),
            source: source || 'lp-whatsapp-inteligente',
            utm_source: utmParams?.utm_source || null,
            utm_medium: utmParams?.utm_medium || null,
            utm_campaign: utmParams?.utm_campaign || null,
            utm_term: utmParams?.utm_term || null,
            utm_content: utmParams?.utm_content || null,
            created_at: new Date().toISOString()
        }

        console.log('[LP Register] Novo lead:', leadData)

        // Envia para webhook n8n (fire and forget)
        const n8nWebhookUrl = process.env.N8N_LP_WEBHOOK_URL
        if (n8nWebhookUrl) {
            fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            }).catch(err => console.error('[LP Register] Erro ao enviar para n8n:', err))
        }

        return NextResponse.json({
            success: true,
            message: 'Inscrição confirmada!',
            lead: {
                whatsapp: cleanWhatsapp,
                email: leadData.email
            }
        })

    } catch (error) {
        console.error('[LP Register] Erro:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno' },
            { status: 500 }
        )
    }
}
