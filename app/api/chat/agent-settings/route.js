/**
 * API: Contact Agent Settings
 * 
 * GET: Fetch agent status for a contact in a conversation
 * PATCH: Enable/disable agent for a contact
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createChatSupabaseClient } from '@/lib/supabase/chat-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper para criar cliente Supabase com cookies (para autenticação)
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

        // Get authenticated user
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json(
                { error: 'conversationId é obrigatório' },
                { status: 400 }
            );
        }

        // 1. Fetch conversation from Chat DB to get contact info
        const chatSupabase = createChatSupabaseClient();
        const { data: conversation, error: convError } = await chatSupabase
            .from('whatsapp_conversations')
            .select(`
        id,
        connection_id,
        contact:whatsapp_contacts(id, whatsapp_number)
      `)
            .eq('id', conversationId)
            .single();

        if (convError || !conversation) {
            return NextResponse.json(
                { error: 'Conversa não encontrada' },
                { status: 404 }
            );
        }

        const whatsappNumber = conversation.contact?.whatsapp_number;
        const connectionId = conversation.connection_id;

        if (!whatsappNumber || !connectionId) {
            return NextResponse.json(
                { error: 'Dados da conversa incompletos' },
                { status: 400 }
            );
        }

        // 2. Check if user owns this connection
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, user_id')
            .eq('id', connectionId)
            .eq('user_id', session.user.id)
            .single();

        if (connError || !connection) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 403 }
            );
        }

        // 3. Fetch agent settings from Main DB
        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('contact_agent_settings')
            .select('agent_enabled, disabled_at, disabled_reason')
            .eq('connection_id', connectionId)
            .eq('whatsapp_number', whatsappNumber)
            .maybeSingle();

        // Default: agent is enabled if no record exists
        const agentEnabled = settings?.agent_enabled !== false;

        return NextResponse.json({
            success: true,
            agentEnabled,
            disabledAt: settings?.disabled_at || null,
            disabledReason: settings?.disabled_reason || null
        });

    } catch (error) {
        console.error('Error in GET /api/chat/agent-settings:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno' },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        const supabase = await createAuthClient();

        // Get authenticated user
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { conversationId, agentEnabled, reason } = body;

        if (!conversationId || typeof agentEnabled !== 'boolean') {
            return NextResponse.json(
                { error: 'conversationId e agentEnabled são obrigatórios' },
                { status: 400 }
            );
        }

        // 1. Fetch conversation from Chat DB to get contact info
        const chatSupabase = createChatSupabaseClient();
        const { data: conversation, error: convError } = await chatSupabase
            .from('whatsapp_conversations')
            .select(`
        id,
        connection_id,
        contact:whatsapp_contacts(id, whatsapp_number, name)
      `)
            .eq('id', conversationId)
            .single();

        if (convError || !conversation) {
            return NextResponse.json(
                { error: 'Conversa não encontrada' },
                { status: 404 }
            );
        }

        const whatsappNumber = conversation.contact?.whatsapp_number;
        const connectionId = conversation.connection_id;

        if (!whatsappNumber || !connectionId) {
            return NextResponse.json(
                { error: 'Dados da conversa incompletos' },
                { status: 400 }
            );
        }

        // 2. Check if user owns this connection
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, user_id')
            .eq('id', connectionId)
            .eq('user_id', session.user.id)
            .single();

        if (connError || !connection) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 403 }
            );
        }

        // 3. Upsert agent settings in Main DB
        const settingsData = {
            connection_id: connectionId,
            whatsapp_number: whatsappNumber,
            agent_enabled: agentEnabled,
            disabled_at: agentEnabled ? null : new Date().toISOString(),
            disabled_reason: agentEnabled ? null : (reason || null),
            updated_at: new Date().toISOString()
        };

        const { data: updatedSettings, error: upsertError } = await supabaseAdmin
            .from('contact_agent_settings')
            .upsert(settingsData, {
                onConflict: 'connection_id,whatsapp_number',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (upsertError) {
            console.error('Error upserting agent settings:', upsertError);
            return NextResponse.json(
                { error: 'Erro ao salvar configurações' },
                { status: 500 }
            );
        }

        console.log(`🤖 Agent ${agentEnabled ? 'ENABLED' : 'DISABLED'} for contact: ${whatsappNumber}`);

        return NextResponse.json({
            success: true,
            agentEnabled: updatedSettings.agent_enabled,
            message: agentEnabled
                ? 'Agente ativado para este contato'
                : 'Agente desativado para este contato'
        });

    } catch (error) {
        console.error('Error in PATCH /api/chat/agent-settings:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno' },
            { status: 500 }
        );
    }
}
