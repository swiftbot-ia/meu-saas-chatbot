/**
 * Contact Tags API Route
 * GET /api/contacts/[id]/tags - Lista tags do contato
 * POST /api/contacts/[id]/tags - Adiciona tag ao contato
 * DELETE /api/contacts/[id]/tags - Remove tag do contato
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper para criar cliente Supabase com cookies (para autenticação)
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

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { data: assignments, error } = await chatSupabase
            .from('contact_tag_assignments')
            .select(`
        id,
        assigned_at,
        tag:contact_tags (
          id,
          name,
          color,
          description
        )
      `)
            .eq('contact_id', id);

        if (error) {
            console.error('Erro ao buscar tags do contato:', error);
            return NextResponse.json({ error: 'Erro ao buscar tags' }, { status: 500 });
        }

        const tags = assignments?.map(a => a.tag) || [];

        return NextResponse.json({ tags });

    } catch (error) {
        console.error('Erro na API de tags do contato:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id } = await params;

        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { tagId } = body;

        if (!tagId) {
            return NextResponse.json({ error: 'ID da tag é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { data: assignment, error } = await chatSupabase
            .from('contact_tag_assignments')
            .insert({
                contact_id: id,
                tag_id: tagId,
                assigned_by: session.user.id
            })
            .select(`
        id,
        tag:contact_tags (
          id,
          name,
          color
        )
      `)
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json({ error: 'Tag já atribuída a este contato' }, { status: 400 });
            }
            console.error('Erro ao adicionar tag:', error);
            return NextResponse.json({ error: 'Erro ao adicionar tag' }, { status: 500 });
        }

        return NextResponse.json({ assignment });

    } catch (error) {
        console.error('Erro na API de tags do contato:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const tagId = searchParams.get('tagId');

        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!tagId) {
            return NextResponse.json({ error: 'ID da tag é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        const { error } = await chatSupabase
            .from('contact_tag_assignments')
            .delete()
            .eq('contact_id', id)
            .eq('tag_id', tagId);

        if (error) {
            console.error('Erro ao remover tag:', error);
            return NextResponse.json({ error: 'Erro ao remover tag' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erro na API de tags do contato:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
