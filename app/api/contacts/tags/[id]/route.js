/**
 * Delete Tag API Route
 * DELETE /api/contacts/tags/[id] - Exclui uma tag permanentemente
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

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Verify tag belongs to user before deleting
        const { data: tag, error: checkError } = await chatSupabase
            .from('contact_tags')
            .select('user_id')
            .eq('id', id)
            .single();

        if (checkError || !tag) {
            return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
        }

        if (tag.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Não autorizado a excluir esta tag' }, { status: 403 });
        }

        // Delete tag (assignments will be deleted via CASCADE)
        const { error } = await chatSupabase
            .from('contact_tags')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao excluir tag:', error);
            return NextResponse.json({ error: 'Erro ao excluir tag' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erro na API de exclusão de tag:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
