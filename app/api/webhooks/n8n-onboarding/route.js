/**
 * API Route: Webhook Unificado de Onboarding
 * Recebe eventos de onboarding e envia para n8n
 */

import { NextResponse } from 'next/server'
import { sendOnboardingWebhook, sendContaCriadaWebhook, sendTrialIniciadoWebhook } from '@/lib/webhooks/onboarding-webhook'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const data = await request.json()
        const { event } = data

        console.log('📡 [Onboarding] Evento recebido:', event)

        switch (event) {
            case 'conta_criada':
                await sendContaCriadaWebhook({
                    user_id: data.user_id,
                    email: data.email,
                    full_name: data.full_name,
                    company_name: data.company_name,
                    business_sector: data.business_sector,
                    phone: data.phone
                })
                break

            case 'trial_iniciado':
                await sendTrialIniciadoWebhook(
                    {
                        user_id: data.user_id,
                        email: data.email,
                        full_name: data.full_name
                    },
                    {
                        trial_start_date: data.trial_start_date,
                        trial_end_date: data.trial_end_date,
                        connections_purchased: data.connections
                    }
                )
                break

            default:
                // Evento genérico
                await sendOnboardingWebhook(event, data)
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('❌ [Onboarding] Erro:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
