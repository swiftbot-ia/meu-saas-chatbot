/**
 * API Route: Webhook de Agente Criado/Atualizado
 * Chamada quando um agente de IA é configurado
 */

import { NextResponse } from 'next/server'
import { sendAgenteCriadoWebhook } from '@/lib/webhooks/onboarding-webhook'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { userId, connectionId, agentData, isNew } = await request.json()

        console.log('📨 [N8nAgent] Recebendo dados do agente:', {
            userId,
            connectionId,
            agentName: agentData?.agent_name
        })

        // Buscar conexão para dados adicionais
        let connection = null
        if (connectionId) {
            const { data } = await supabaseAdmin
                .from('whatsapp_connections')
                .select('id, instance_name, phone_number, profile_name')
                .eq('id', connectionId)
                .single()
            connection = data
        }

        // Enviar webhook
        await sendAgenteCriadoWebhook(userId, {
            id: agentData?.id || null,
            agent_name: agentData?.agent_name,
            company_name: agentData?.company_name,
            bot_objective: agentData?.bot_objective,
            is_active: agentData?.is_active ?? true
        }, connection)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('❌ [N8nAgent] Erro:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
