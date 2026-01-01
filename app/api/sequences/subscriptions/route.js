/**
 * Sequence Subscriptions API Route
 * GET /api/sequences/subscriptions?contactId={id} - Lista inscrições de um contato
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
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

export async function GET(request) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('contactId');

        if (!contactId) {
            return NextResponse.json({ error: 'contactId é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Get subscriptions from Chat DB
        const { data: subscriptions, error: subError } = await chatSupabase
            .from('automation_sequence_subscriptions')
            .select('id, sequence_id, status, current_step, started_at, next_step_at')
            .eq('contact_id', contactId)
            .in('status', ['active', 'pending']);

        if (subError) {
            console.error('Erro ao buscar inscrições:', subError);
            return NextResponse.json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
        }

        // Get sequence details from Main DB
        const sequenceIds = subscriptions?.map(s => s.sequence_id) || [];

        let sequencesMap = {};
        if (sequenceIds.length > 0) {
            const { data: sequences } = await supabaseAdmin
                .from('automation_sequences')
                .select('id, name')
                .in('id', sequenceIds);

            sequencesMap = (sequences || []).reduce((acc, seq) => {
                acc[seq.id] = seq;
                return acc;
            }, {});
        }

        // Join the data
        const enrichedSubscriptions = (subscriptions || []).map(sub => ({
            ...sub,
            sequence: sequencesMap[sub.sequence_id] || null
        }));

        return NextResponse.json({
            success: true,
            subscriptions: enrichedSubscriptions
        });

    } catch (error) {
        console.error('Erro na API de subscriptions:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
