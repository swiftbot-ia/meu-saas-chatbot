import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * POST /api/lp/register
 * Registra um lead da landing page
 */
export async function POST(request) {
    try {
        const { whatsapp, email, name, utmParams, source } = await request.json()

        if (!whatsapp || !email || !name) {
            return NextResponse.json(
                { success: false, error: 'WhatsApp, nome e email são obrigatórios' },
                { status: 400 }
            )
        }

        // Limpa o número
        const cleanWhatsapp = whatsapp.replace(/\D/g, '')

        // Prepara dados do lead
        const leadData = {
            whatsapp: cleanWhatsapp,
            email: email.trim().toLowerCase(),
            name: name.trim(),
            source: source || 'lp-whatsapp-inteligente',
            utm_source: utmParams?.utm_source || null,
            utm_medium: utmParams?.utm_medium || null,
            utm_campaign: utmParams?.utm_campaign || null,
            utm_term: utmParams?.utm_term || null,
            utm_content: utmParams?.utm_content || null
        }

        console.log('[LP Register] Novo lead:', leadData)

        // Salva no banco de dados Supabase
        const { data: savedLead, error: dbError } = await supabase
            .from('lp_leads')
            .insert(leadData)
            .select()
            .single()

        if (dbError) {
            console.error('[LP Register] Erro ao salvar no banco:', dbError)
            // Continua mesmo com erro no banco (fail-safe)
        } else {
            console.log('[LP Register] Lead salvo no banco:', savedLead?.id)
        }

        // Envia para webhook n8n (fire and forget)
        const n8nWebhookUrl = process.env.N8N_LP_WEBHOOK_URL
        if (n8nWebhookUrl) {
            fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...leadData, created_at: savedLead?.created_at || new Date().toISOString() })
            }).catch(err => console.error('[LP Register] Erro ao enviar para n8n:', err))
        }

        return NextResponse.json({
            success: true,
            message: 'Inscrição confirmada!',
            lead: {
                id: savedLead?.id,
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
