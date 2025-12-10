/**
 * API Route: /api/automations/sequences/[id]
 * Gerencia uma sequência específica (GET, PUT, DELETE)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Detalhes de uma sequência
export async function GET(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: sequence, error } = await supabase
            .from('automation_sequences')
            .select(`
        *,
        automation_sequence_steps (
          id,
          automation_id,
          delay_value,
          delay_unit,
          send_time,
          send_day,
          is_active,
          order_index,
          sent_count,
          click_count,
          automations (id, name, automation_responses (id, content))
        )
      `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !sequence) {
            return NextResponse.json({ error: 'Sequência não encontrada' }, { status: 404 })
        }

        // Ordenar steps
        if (sequence.automation_sequence_steps) {
            sequence.automation_sequence_steps.sort((a, b) => a.order_index - b.order_index)
        }

        return NextResponse.json({ sequence })

    } catch (error) {
        console.error('Erro no GET /api/automations/sequences/[id]:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// PUT - Atualizar sequência
export async function PUT(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { name, description, isActive, steps } = body

        // Verificar propriedade
        const { data: existing } = await supabase
            .from('automation_sequences')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Sequência não encontrada' }, { status: 404 })
        }

        // Atualizar sequência
        const updateData = { updated_at: new Date().toISOString() }
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (isActive !== undefined) updateData.is_active = isActive

        await supabase.from('automation_sequences').update(updateData).eq('id', id)

        // Atualizar steps se fornecidos
        if (steps !== undefined) {
            // Remover steps existentes
            await supabase.from('automation_sequence_steps').delete().eq('sequence_id', id)

            // Inserir novos
            if (steps.length > 0) {
                const stepsToInsert = steps.map((step, index) => ({
                    sequence_id: id,
                    automation_id: step.automationId || null,
                    delay_value: step.delayValue || 1,
                    delay_unit: step.delayUnit || 'days',
                    send_time: step.sendTime || null,
                    send_day: step.sendDay || 'any',
                    is_active: step.isActive !== undefined ? step.isActive : true,
                    order_index: index
                }))

                await supabase.from('automation_sequence_steps').insert(stepsToInsert)
            }
        }

        // Buscar sequência atualizada
        const { data: sequence } = await supabase
            .from('automation_sequences')
            .select(`
        *,
        automation_sequence_steps (
          id, automation_id, delay_value, delay_unit, is_active, order_index,
          automations (id, name)
        )
      `)
            .eq('id', id)
            .single()

        return NextResponse.json({ sequence })

    } catch (error) {
        console.error('Erro no PUT /api/automations/sequences/[id]:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// DELETE - Excluir sequência
export async function DELETE(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { error } = await supabase
            .from('automation_sequences')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Erro ao excluir sequência:', error)
            return NextResponse.json({ error: 'Erro ao excluir sequência' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Erro no DELETE /api/automations/sequences/[id]:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
