import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLiveDubaiConfirmation } from '@/lib/brevoEmail'

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

        // Envia para webhook n8n Live Dubai (fire and forget)
        const webhookUrl = process.env.N8N_WEBHOOK_LIVE_DUBAI
        if (webhookUrl) {
            const webhookPayload = {
                // Dados do lead
                name: leadData.name,
                whatsapp: leadData.whatsapp,
                email: leadData.email,
                source: leadData.source,
                // UTMs
                utm_source: leadData.utm_source,
                utm_medium: leadData.utm_medium,
                utm_campaign: leadData.utm_campaign,
                utm_term: leadData.utm_term,
                utm_content: leadData.utm_content,
                // Metadados
                lead_id: savedLead?.id || null,
                created_at: savedLead?.created_at || new Date().toISOString(),
                registered_at: new Date().toISOString()
            }

            console.log('[LP Register] Enviando para webhook:', webhookUrl)

            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            })
                .then(res => console.log('[LP Register] Webhook respondeu:', res.status))
                .catch(err => console.error('[LP Register] Erro ao enviar para webhook:', err))
        } else {
            console.warn('[LP Register] N8N_WEBHOOK_LIVE_DUBAI não configurado')
        }

        // Envia email de confirmação via Brevo (fire and forget)
        sendLiveDubaiConfirmation({ name: leadData.name, email: leadData.email })
            .then(result => {
                if (result.success) {
                    console.log('[LP Register] Email de confirmação enviado:', result.messageId)
                } else {
                    console.error('[LP Register] Erro ao enviar email:', result.error)
                }
            })
            .catch(err => console.error('[LP Register] Erro no envio de email:', err))

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
