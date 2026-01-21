import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/agent/documents/categories
 * List all categories for the authenticated user's agent
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const connectionId = searchParams.get('connectionId');

        // Get user session using server client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Get agent - support multiple agents
        let agentQuery = supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id);

        if (connectionId) {
            agentQuery = agentQuery.eq('connection_id', connectionId);
        }

        const { data: agents } = await agentQuery.limit(1);
        const agent = agents?.[0];

        if (!agent) {
            return NextResponse.json({ categories: [] });
        }

        // Get categories
        const { data: categories, error } = await supabaseAdmin
            .from('document_categories')
            .select('*')
            .eq('agent_id', agent.id)
            .order('name');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ categories: categories || [] });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/agent/documents/categories
 * Create a new category
 * Body: { name: string, description?: string, color?: string, connectionId?: string }
 */
export async function POST(request) {
    try {
        // Get user session using server client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, color, connectionId } = body;

        // Get agent - support multiple agents
        let agentQuery = supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id);

        if (connectionId) {
            agentQuery = agentQuery.eq('connection_id', connectionId);
        }

        const { data: agents } = await agentQuery.limit(1);
        const agent = agents?.[0];

        if (!agent) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        // Create category
        const { data: category, error } = await supabaseAdmin
            .from('document_categories')
            .insert({
                agent_id: agent.id,
                name: name.trim(),
                description: description || null,
                color: color || '#00FF99'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Categoria já existe' }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ category, success: true });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
