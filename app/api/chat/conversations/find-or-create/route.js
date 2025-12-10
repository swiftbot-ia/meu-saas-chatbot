/**
 * Create or Find Conversation by Phone API
 * POST /api/chat/conversations/find-or-create
 * Creates a new conversation for a contact if one doesn't exist
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Helper to create auth client
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
        const { phone, connectionId } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
        }

        if (!connectionId) {
            return NextResponse.json({ error: 'Connection ID é obrigatório' }, { status: 400 });
        }

        // Get connection details
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, instance_name, user_id')
            .eq('id', connectionId)
            .eq('user_id', session.user.id)
            .single();

        if (connError || !connection) {
            return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Normalize phone for search
        const normalizedPhone = phone.replace(/\D/g, '');

        // 1. Try to find existing contact by phone
        const { data: existingContacts } = await chatSupabase
            .from('whatsapp_contacts')
            .select('id, whatsapp_number, name')
            .or(`whatsapp_number.ilike.%${normalizedPhone}%`);

        let contact = existingContacts?.[0];

        // 2. If no contact, create one
        if (!contact) {
            const { data: newContact, error: createContactError } = await chatSupabase
                .from('whatsapp_contacts')
                .insert({
                    whatsapp_number: normalizedPhone,
                    name: `Contato ${normalizedPhone.slice(-4)}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createContactError) {
                console.error('Erro ao criar contato:', createContactError);
                return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 });
            }

            contact = newContact;
            console.log('✅ Created new contact:', contact.id);
        }

        // 3. Check if conversation already exists for this contact + instance
        const { data: existingConversation } = await chatSupabase
            .from('whatsapp_conversations')
            .select(`
                id,
                instance_name,
                contact:whatsapp_contacts!contact_id (
                    id,
                    whatsapp_number,
                    name,
                    profile_pic_url
                )
            `)
            .eq('contact_id', contact.id)
            .eq('instance_name', connection.instance_name)
            .single();

        if (existingConversation) {
            console.log('✅ Found existing conversation:', existingConversation.id);
            return NextResponse.json({
                conversation: existingConversation,
                created: false
            });
        }

        // 4. Create new conversation
        const { data: newConversation, error: createConvError } = await chatSupabase
            .from('whatsapp_conversations')
            .insert({
                instance_name: connection.instance_name,
                connection_id: connection.id,
                user_id: session.user.id,
                contact_id: contact.id,
                funnel_stage: 'novo',
                funnel_position: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select(`
                id,
                instance_name,
                contact:whatsapp_contacts!contact_id (
                    id,
                    whatsapp_number,
                    name,
                    profile_pic_url
                )
            `)
            .single();

        if (createConvError) {
            console.error('Erro ao criar conversa:', createConvError);
            return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
        }

        console.log('✅ Created new conversation:', newConversation.id);

        return NextResponse.json({
            conversation: newConversation,
            created: true
        });

    } catch (error) {
        console.error('Erro na API find-or-create:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
