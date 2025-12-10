/**
 * API Route: /api/automations/folders
 * Gerencia pastas para organização das automações
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Lista pastas do usuário
export async function GET(request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')

        let query = supabase
            .from('automation_folders')
            .select('*')
            .eq('user_id', user.id)
            .order('name')

        if (connectionId) {
            query = query.eq('connection_id', connectionId)
        }

        const { data: folders, error } = await query

        if (error) {
            console.error('Erro ao buscar pastas:', error)
            return NextResponse.json({ error: 'Erro ao buscar pastas' }, { status: 500 })
        }

        return NextResponse.json({ folders: folders || [] })

    } catch (error) {
        console.error('Erro no GET /api/automations/folders:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// POST - Criar nova pasta
export async function POST(request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { connectionId, name } = body

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

        const { data: folder, error: createError } = await supabase
            .from('automation_folders')
            .insert({
                user_id: user.id,
                connection_id: connectionId,
                name: name.trim()
            })
            .select()
            .single()

        if (createError) {
            console.error('Erro ao criar pasta:', createError)
            return NextResponse.json({ error: 'Erro ao criar pasta' }, { status: 500 })
        }

        return NextResponse.json({ folder }, { status: 201 })

    } catch (error) {
        console.error('Erro no POST /api/automations/folders:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

// DELETE - Excluir pasta (via query param id)
export async function DELETE(request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        const { error } = await supabase
            .from('automation_folders')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Erro ao excluir pasta:', error)
            return NextResponse.json({ error: 'Erro ao excluir pasta' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Erro no DELETE /api/automations/folders:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
