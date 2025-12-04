/**
 * Tags API Route
 * GET /api/contacts/tags - Lista todas as tags
 * POST /api/contacts/tags - Cria nova tag
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper para criar cliente Supabase com cookies (para autenticação)
function createAuthClient() {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value;
                },
                set(name, value, options) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name, options) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
}

export async function GET() {
    try {
        const supabase = createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { data: tags, error } = await chatSupabase
            .from('contact_tags')
            .select('*')
            .order('name');

        if (error) {
            console.error('Erro ao buscar tags:', error);
            return NextResponse.json({ error: 'Erro ao buscar tags' }, { status: 500 });
        }

        return NextResponse.json({ tags: tags || [] });

    } catch (error) {
        console.error('Erro na API de tags:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const supabase = createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, color, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Nome da tag é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { data: tag, error } = await chatSupabase
            .from('contact_tags')
            .insert({
                name,
                color: color || '#00FF99',
                description: description || null,
                user_id: session.user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar tag:', error);
            return NextResponse.json({ error: 'Erro ao criar tag' }, { status: 500 });
        }

        return NextResponse.json({ tag });

    } catch (error) {
        console.error('Erro na API de tags:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
