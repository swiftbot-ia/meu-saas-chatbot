import { NextResponse } from 'next/server'
import { sendLiveDubaiConfirmation } from '@/lib/brevoEmail'
import { sendLeadEvent } from '@/lib/metaPixel'

// Force dynamic rendering - prevents static analysis during build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy initialization with dynamic import to avoid build-time errors
let supabase = null
async function getSupabase() {
    if (!supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (url && key) {
            const { createClient } = await import('@supabase/supabase-js')
            supabase = createClient(url, key)
        }
    }
    return supabase
}

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
        const client = await getSupabase()
        let savedLead = null

        if (client) {
            const { data, error: dbError } = await client
                .from('lp_leads')
                .insert(leadData)
                .select()
                .single()

            if (dbError) {
                console.error('[LP Register] Erro ao salvar no banco:', dbError)
                // Continua mesmo com erro no banco (fail-safe)
            } else {
                savedLead = data
                console.log('[LP Register] Lead salvo no banco:', savedLead?.id)
            }
        } else {
            console.warn('[LP Register] Supabase client not configured')
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

        // Envia evento Lead para Meta Conversions API (fire and forget)
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown'
        const userAgent = request.headers.get('user-agent') || ''

        sendLeadEvent(
            {
                email: leadData.email,
                phone: cleanWhatsapp,
                name: leadData.name,
                source: leadData.source
            },
            {
                eventSourceUrl: 'https://swiftbot.com.br/lp/whatsApp-inteligente',
                clientIp,
                userAgent
            }
        )
            .then(result => {
                if (result.success) {
                    console.log('[LP Register] Evento Meta Lead enviado')
                } else {
                    console.error('[LP Register] Erro ao enviar evento Meta:', result.error)
                }
            })
            .catch(err => console.error('[LP Register] Erro no evento Meta:', err))

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
