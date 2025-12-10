/**
 * API Route: /api/automations/[id]
 * Gerencia uma automação específica (GET, PUT, DELETE)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Detalhes de uma automação
export async function GET(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { data: automation, error } = await supabase
            .from('automations')
            .select(`
        *,
        automation_keywords (id, keyword, match_type, is_case_sensitive),
        automation_responses (id, response_type, content, media_url, delay_seconds, order_index),
        automation_folders!automations_folder_id_fkey (id, name)
      `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !automation) {
            return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })
        }

        return NextResponse.json({ automation })

    } catch (error) {
        console.error('Erro no GET /api/automations/[id]:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// PUT - Atualizar automação
export async function PUT(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            description,
            triggerType,
            isActive,
            folderId,
            keywords,
            responses,
            actionWebhookUrl,
            actionWebhookEnabled,
            actionAddTags,
            actionSetOriginId
        } = body

        // Verificar propriedade
        const { data: existing, error: existingError } = await supabase
            .from('automations')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (existingError || !existing) {
            return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })
        }

        // Atualizar automação
        const updateData = { updated_at: new Date().toISOString() }
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (triggerType !== undefined) updateData.trigger_type = triggerType
        if (isActive !== undefined) updateData.is_active = isActive
        if (folderId !== undefined) updateData.folder_id = folderId || null

        // Action fields
        if (actionWebhookUrl !== undefined) updateData.action_webhook_url = actionWebhookUrl || null
        if (actionWebhookEnabled !== undefined) updateData.action_webhook_enabled = actionWebhookEnabled
        if (actionAddTags !== undefined) updateData.action_add_tags = actionAddTags || []
        if (actionSetOriginId !== undefined) updateData.action_set_origin_id = actionSetOriginId || null

        const { error: updateError } = await supabase
            .from('automations')
            .update(updateData)
            .eq('id', id)

        if (updateError) {
            console.error('Erro ao atualizar automação:', updateError)
            return NextResponse.json({ error: 'Erro ao atualizar automação' }, { status: 500 })
        }

        // Atualizar keywords se fornecidas
        if (keywords !== undefined) {
            // Remover keywords existentes
            await supabase.from('automation_keywords').delete().eq('automation_id', id)

            // Inserir novas
            if (keywords.length > 0) {
                const keywordsToInsert = keywords.map(kw => ({
                    automation_id: id,
                    keyword: typeof kw === 'string' ? kw : kw.keyword,
                    match_type: typeof kw === 'string' ? 'contains' : (kw.matchType || 'contains'),
                    is_case_sensitive: typeof kw === 'string' ? false : (kw.isCaseSensitive || false)
                }))

                await supabase.from('automation_keywords').insert(keywordsToInsert)
            }
        }

        // Atualizar respostas se fornecidas
        if (responses !== undefined) {
            // Remover respostas existentes
            await supabase.from('automation_responses').delete().eq('automation_id', id)

            // Inserir novas
            if (responses.length > 0) {
                const responsesToInsert = responses.map((resp, index) => ({
                    automation_id: id,
                    response_type: resp.type || 'text',
                    content: resp.content,
                    media_url: resp.mediaUrl || null,
                    delay_seconds: resp.delaySeconds || 0,
                    order_index: index
                }))

                await supabase.from('automation_responses').insert(responsesToInsert)
            }
        }

        // Buscar automação atualizada
        const { data: automation } = await supabase
            .from('automations')
            .select(`
        *,
        automation_keywords (id, keyword, match_type),
        automation_responses (id, response_type, content, order_index)
      `)
            .eq('id', id)
            .single()

        return NextResponse.json({ automation })

    } catch (error) {
        console.error('Erro no PUT /api/automations/[id]:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// DELETE - Excluir automação
export async function DELETE(request, { params }) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar propriedade e excluir
        const { error } = await supabase
            .from('automations')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Erro ao excluir automação:', error)
            return NextResponse.json({ error: 'Erro ao excluir automação' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Erro no DELETE /api/automations/[id]:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
