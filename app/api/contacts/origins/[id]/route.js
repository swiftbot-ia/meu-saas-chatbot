/**
 * Origin ID API Route
 * DELETE /api/contacts/origins/[id] - Exclui uma origem
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper para criar cliente Supabase com cookies
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

export async function DELETE(request, { params }) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'ID da origem é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Verificar se a origem pertence ao usuário
        const { data: origin, error: fetchError } = await chatSupabase
            .from('contact_origins')
            .select('*')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (fetchError || !origin) {
            return NextResponse.json({ error: 'Origem não encontrada' }, { status: 404 });
        }

        // Remover referências da origem nos contatos (setar para null)
        await chatSupabase
            .from('whatsapp_contacts')
            .update({ origin_id: null })
            .eq('origin_id', id);

        // Deletar a origem
        const { error: deleteError } = await chatSupabase
            .from('contact_origins')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (deleteError) {
            console.error('Erro ao excluir origem:', deleteError);
            return NextResponse.json({ error: 'Erro ao excluir origem' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erro na API de origens:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
