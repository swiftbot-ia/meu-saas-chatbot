/**
 * API Route: Enviar Lead para n8n
 * Chamada quando um novo usuário completa o cadastro
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const N8N_LEAD_WEBHOOK_URL = process.env.N8N_WEBHOOK_LEAD_URL

export async function POST(request) {
    try {
        const data = await request.json()

        console.log('📨 [N8nLead] Recebendo dados do lead:', {
            user_id: data.user_id,
            email: data.email
        })

        // Validar dados obrigatórios
        if (!data.user_id || !data.email) {
            return NextResponse.json(
                { error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        // Verificar se webhook está configurado
        if (!N8N_LEAD_WEBHOOK_URL) {
            console.warn('⚠️ [N8nLead] N8N_WEBHOOK_LEAD_URL não configurada')
            return NextResponse.json({ success: true, skipped: true })
        }

        // Buscar dados adicionais do usuário
        const { data: subscription } = await supabaseAdmin
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', data.user_id)
            .single()

        // Construir payload
        const payload = {
            event: 'new_lead',
            timestamp: new Date().toISOString(),

            lead: {
                user_id: data.user_id,
                email: data.email,
                full_name: data.full_name,
                company_name: data.company_name,
                business_sector: data.business_sector,
                phone: data.phone
            },

            subscription: subscription ? {
                status: subscription.status,
                plan_type: subscription.billing_period,
                connections: subscription.connections_purchased,
                trial_end_date: subscription.trial_end_date
            } : null
        }

        console.log('🚀 [N8nLead] Enviando para n8n...')

        // Enviar para n8n
        const response = await fetch(N8N_LEAD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            console.error('❌ [N8nLead] Erro no n8n:', response.status)
            return NextResponse.json(
                { error: 'Webhook failed', status: response.status },
                { status: 500 }
            )
        }

        console.log('✅ [N8nLead] Lead enviado com sucesso')

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('❌ [N8nLead] Erro:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
