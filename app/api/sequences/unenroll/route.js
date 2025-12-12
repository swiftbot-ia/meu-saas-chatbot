/**
 * Sequence Unenroll API Route
 * POST /api/sequences/unenroll - Remove um contato de uma sequência
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

export async function POST(request) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json({ error: 'subscriptionId é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Update subscription status to cancelled
        const { error: updateError } = await chatSupabase
            .from('automation_sequence_subscriptions')
            .update({
                status: 'cancelled',
                completed_at: new Date().toISOString()
            })
            .eq('id', subscriptionId);

        if (updateError) {
            console.error('Erro ao remover da sequência:', updateError);
            return NextResponse.json({ error: 'Erro ao remover da sequência' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erro na API de unenroll:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
