/**
 * Origins API Route
 * GET /api/contacts/origins - Lista todas as origens
 * POST /api/contacts/origins - Cria nova origem
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper para criar cliente Supabase com cookies
// NOTA: No Next.js 16, cookies() retorna uma Promise
async function createAuthClient() {
    const cookieStore = await cookies();
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
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { data: origins, error } = await chatSupabase
            .from('contact_origins')
            .select('*')
            .eq('user_id', session.user.id)
            .order('name');

        if (error) {
            console.error('Erro ao buscar origens:', error);
            return NextResponse.json({ error: 'Erro ao buscar origens' }, { status: 500 });
        }

        return NextResponse.json({ origins: origins || [] });

    } catch (error) {
        console.error('Erro na API de origens:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Nome da origem é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { data: origin, error } = await chatSupabase
            .from('contact_origins')
            .insert({
                name,
                user_id: session.user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar origem:', error);
            return NextResponse.json({ error: 'Erro ao criar origem' }, { status: 500 });
        }

        return NextResponse.json({ origin });

    } catch (error) {
        console.error('Erro na API de origens:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
