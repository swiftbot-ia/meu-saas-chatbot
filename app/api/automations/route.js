/**
 * API Route: /api/automations
 * Gerencia automações (keywords, sequences, flows)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getOwnerUserIdFromMember } from '@/lib/account-service'

// GET - Lista automações do usuário
export async function GET(request) {
    try {
        const supabase = await createClient()

        // Verificar autenticação
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
                    console.log('👥 [Automations API] Team member, using owner data:', ownerUserId);
                }
            }
        } catch (accountError) {
            console.log('⚠️ [Automations API] Account check failed:', accountError.message);
        }

        // Parâmetros de query
        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')
        const type = searchParams.get('type') // 'keyword', 'sequence', 'flow'
        const folderId = searchParams.get('folderId')
        const isActive = searchParams.get('isActive')
        const search = searchParams.get('search')

        // Montar query
        let query = supabase
            .from('automations')
            .select(`
        *,
        automation_keywords (id, keyword, match_type),
        automation_responses (id, response_type, content, order_index),
        automation_folders!automations_folder_id_fkey (id, name)
      `)
            .eq('user_id', ownerUserId)
            .order('updated_at', { ascending: false })

        // Filtros opcionais
        if (connectionId) {
            query = query.eq('connection_id', connectionId)
        }
        if (type) {
            query = query.eq('type', type)
        }
        if (folderId) {
            query = query.eq('folder_id', folderId)
        }
        if (isActive !== null && isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true')
        }
        if (search) {
            query = query.ilike('name', `%${search}%`)
        }

        const { data: automations, error } = await query

        if (error) {
            console.error('Erro ao buscar automações:', error)
            return NextResponse.json({ error: 'Erro ao buscar automações' }, { status: 500 })
        }

        // Buscar pastas para o dropdown
        let foldersQuery = supabase
            .from('automation_folders')
            .select('id, name')
            .eq('user_id', ownerUserId)
            .order('name')

        if (connectionId) {
            foldersQuery = foldersQuery.eq('connection_id', connectionId)
        }

        const { data: folders } = await foldersQuery

        return NextResponse.json({
            automations: automations || [],
            folders: folders || []
        })

    } catch (error) {
        console.error('Erro no GET /api/automations:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// POST - Criar nova automação
export async function POST(request) {
    try {
        const supabase = await createClient()

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const {
            connectionId,
            name,
            description,
            type = 'keyword',
            triggerType,
            folderId,
            keywords = [],
            responses = [],
            actionWebhookUrl,
            actionWebhookEnabled,
            actionAddTags,
            actionSetOriginId,
            actionCustomFields
        } = body

        // Validações
        if (!connectionId) {
            return NextResponse.json({ error: 'connectionId é obrigatório' }, { status: 400 })
        }
        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        // Verificar se conexão pertence ao usuário
        const { data: connection, error: connError } = await supabase
            .from('whatsapp_connections')
            .select('id')
            .eq('id', connectionId)
            .eq('user_id', user.id)
            .single()

        if (connError || !connection) {
            return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
        }

        // Criar automação
        const { data: automation, error: createError } = await supabase
            .from('automations')
            .insert({
                user_id: user.id,
                connection_id: connectionId,
                name: name.trim(),
                description: description?.trim() || null,
                type,
                trigger_type: triggerType || 'message_contains',
                trigger_config: body.triggerConfig || {},
                folder_id: folderId || null,
                is_active: true,
                action_webhook_url: actionWebhookUrl || null,
                action_webhook_enabled: actionWebhookEnabled || false,
                action_add_tags: actionAddTags || [],
                action_set_origin_id: actionSetOriginId || null,
                action_custom_fields: actionCustomFields || {}
            })
            .select()
            .single()

        if (createError) {
            console.error('Erro ao criar automação:', createError)
            return NextResponse.json({ error: 'Erro ao criar automação' }, { status: 500 })
        }

        // Inserir keywords se fornecidas
        if (keywords.length > 0) {
            const keywordsToInsert = keywords.map(kw => ({
                automation_id: automation.id,
                keyword: typeof kw === 'string' ? kw : kw.keyword,
                match_type: typeof kw === 'string' ? 'contains' : (kw.matchType || 'contains'),
                is_case_sensitive: typeof kw === 'string' ? false : (kw.isCaseSensitive || false)
            }))

            const { error: kwError } = await supabase
                .from('automation_keywords')
                .insert(keywordsToInsert)

            if (kwError) {
                console.error('Erro ao inserir keywords:', kwError)
            }
        }

        // Inserir respostas se fornecidas
        if (responses.length > 0) {
            const responsesToInsert = responses.map((resp, index) => ({
                automation_id: automation.id,
                response_type: resp.type || 'text',
                content: resp.content,
                media_url: resp.mediaUrl || null,
                delay_seconds: resp.delaySeconds || 0,
                order_index: index
            }))

            const { error: respError } = await supabase
                .from('automation_responses')
                .insert(responsesToInsert)

            if (respError) {
                console.error('Erro ao inserir respostas:', respError)
            }
        }

        // Buscar automação completa
        const { data: fullAutomation } = await supabase
            .from('automations')
            .select(`
        *,
        automation_keywords (id, keyword, match_type),
        automation_responses (id, response_type, content, order_index)
      `)
            .eq('id', automation.id)
            .single()

        return NextResponse.json({ automation: fullAutomation }, { status: 201 })

    } catch (error) {
        console.error('Erro no POST /api/automations:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
