/**
 * Sequence Enroll API Route
 * POST /api/sequences/enroll - Inscreve um contato em uma sequência
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

export async function POST(request) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { contactId, sequenceId } = body;

        if (!contactId || !sequenceId) {
            return NextResponse.json({ error: 'contactId e sequenceId são obrigatórios' }, { status: 400 });
        }

        // Get the sequence from main DB
        const { data: sequence, error: seqError } = await supabaseAdmin
            .from('automation_sequences')
            .select('id, name, connection_id')
            .eq('id', sequenceId)
            .single();

        if (seqError || !sequence) {
            return NextResponse.json({ error: 'Sequência não encontrada' }, { status: 404 });
        }

        // Get connection for instance_name
        const { data: connection } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('instance_name')
            .eq('id', sequence.connection_id)
            .single();

        const chatSupabase = createChatSupabaseAdminClient();

        // Check if already enrolled
        const { data: existing } = await chatSupabase
            .from('automation_sequence_subscriptions')
            .select('id, status')
            .eq('contact_id', contactId)
            .eq('sequence_id', sequenceId)
            .in('status', ['active', 'pending'])
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'Contato já está inscrito nesta sequência' }, { status: 400 });
        }

        // Get first step of the sequence
        const { data: steps, error: stepError } = await supabaseAdmin
            .from('automation_sequence_steps')
            .select('id, order_index')
            .eq('sequence_id', sequenceId)
            .order('order_index', { ascending: true });

        console.log('📋 [Enroll] Data:', {
            contactId,
            sequenceId,
            connectionId: sequence.connection_id,
            stepsCount: steps?.length || 0,
            stepError: stepError?.message
        });

        // Get conversation_id for this contact
        const { data: conversation } = await chatSupabase
            .from('whatsapp_conversations')
            .select('id')
            .eq('contact_id', contactId)
            .maybeSingle();

        // Create subscription - current_step is INTEGER (index), not UUID
        const { data: subscription, error: subError } = await chatSupabase
            .from('automation_sequence_subscriptions')
            .insert({
                sequence_id: sequenceId,
                contact_id: contactId,
                connection_id: sequence.connection_id,
                conversation_id: conversation?.id || null,
                current_step: 0, // Start at first step (index 0)
                status: 'active',
                started_at: new Date().toISOString(),
                next_step_at: new Date().toISOString() // Process immediately
            })
            .select()
            .single();

        if (subError) {
            console.error('Erro ao inscrever na sequência:', subError);
            return NextResponse.json({ error: 'Erro ao inscrever na sequência: ' + subError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, subscription });

    } catch (error) {
        console.error('Erro na API de enroll:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
