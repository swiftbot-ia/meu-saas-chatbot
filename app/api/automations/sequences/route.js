/**
 * API Route: /api/automations/sequences
 * Gerencia sequências de automação (follow-ups programados)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getOwnerUserIdFromMember } from '@/lib/account-service'

// GET - Lista sequências do usuário
export async function GET(request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Get owner's user ID for team data sharing
        let ownerUserId = user.id;
        try {
            const ownerFromService = await getOwnerUserIdFromMember(user.id);
            if (ownerFromService) {
                ownerUserId = ownerFromService;
                if (ownerUserId !== user.id) {
                    console.log('👥 [Sequences API] Team member, using owner data:', ownerUserId);
                }
            }
        } catch (accountError) {
            console.log('⚠️ [Sequences API] Account check failed:', accountError.message);
        }

        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')
        const isActive = searchParams.get('isActive')

        let query = supabase
            .from('automation_sequences')
            .select(`
        *,
        automation_sequence_steps (
          id, 
          automation_id, 
          template_id,
          delay_value, 
          delay_unit,
          time_window_start,
          time_window_end,
          allowed_days,
          is_active, 
          order_index,
          sent_count,
          click_count,
          message_templates (id, name, content),
          automations (id, name)
        )
      `)
            .eq('user_id', ownerUserId)
            .order('updated_at', { ascending: false })

        if (connectionId) {
            query = query.eq('connection_id', connectionId)
        }
        if (isActive !== null && isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true')
        }

        const { data: sequences, error } = await query

        if (error) {
            console.error('Erro ao buscar sequências:', error)
            return NextResponse.json({ error: 'Erro ao buscar sequências' }, { status: 500 })
        }

        // Calcular métricas para cada sequência
        const sequencesWithMetrics = sequences?.map(seq => {
            const steps = seq.automation_sequence_steps || []
            const totalSent = steps.reduce((sum, s) => sum + (s.sent_count || 0), 0)
            const totalClicks = steps.reduce((sum, s) => sum + (s.click_count || 0), 0)
            const openRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : 0

            return {
                ...seq,
                messagesCount: steps.length,
                totalSent,
                openRate: `${openRate}%`,
                ctr: `${openRate}%`
            }
        }) || []

        return NextResponse.json({ sequences: sequencesWithMetrics })

    } catch (error) {
        console.error('Erro no GET /api/automations/sequences:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// POST - Criar nova sequência
export async function POST(request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const {
            connectionId,
            name,
            description,
            steps = [],
            triggerType = 'manual',
            triggerTagId = null,
            triggerOriginId = null,
            triggerKeywords = []
        } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'connectionId é obrigatório' }, { status: 400 })
        }
        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        // Verificar conexão
        const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('id')
            .eq('id', connectionId)
            .eq('user_id', user.id)
            .single()

        if (!connection) {
            return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
        }

        // Criar sequência
        const { data: sequence, error: createError } = await supabase
            .from('automation_sequences')
            .insert({
                user_id: user.id,
                connection_id: connectionId,
                name: name.trim(),
                description: description?.trim() || null,
                is_active: true,
                trigger_type: triggerType,
                trigger_tag_id: triggerTagId || null,
                trigger_origin_id: triggerOriginId || null,
                trigger_keywords: triggerKeywords || []
            })
            .select()
            .single()

        if (createError) {
            console.error('Erro ao criar sequência:', createError)
            return NextResponse.json({ error: 'Erro ao criar sequência' }, { status: 500 })
        }

        // Inserir steps se fornecidos
        if (steps.length > 0) {
            const stepsToInsert = steps.map((step, index) => ({
                sequence_id: sequence.id,
                automation_id: step.automationId || null,
                template_id: step.templateId || null,
                delay_value: step.delayValue || 1,
                delay_unit: step.delayUnit || 'hours',
                time_window_start: step.timeWindowStart || null,
                time_window_end: step.timeWindowEnd || null,
                allowed_days: step.allowedDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                is_active: step.isActive !== false,
                order_index: index
            }))

            await supabase.from('automation_sequence_steps').insert(stepsToInsert)
        }

        return NextResponse.json({ sequence }, { status: 201 })

    } catch (error) {
        console.error('Erro no POST /api/automations/sequences:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
