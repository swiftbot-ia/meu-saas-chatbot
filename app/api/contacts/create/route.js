/**
 * Create Contact/Opportunity API
 * POST /api/contacts/create - Manually create a new contact and opportunity
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

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
        const body = await request.json();
        const { name, phone, origin_id, funnel_stage, instance_name } = body;

        // Validate required fields
        if (!name || !phone || !instance_name) {
            return NextResponse.json(
                { error: 'name, phone, and instance_name are required' },
                { status: 400 }
            );
        }

        // Clean phone number (remove non-digits except +)
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        if (cleanPhone.length < 10) {
            return NextResponse.json(
                { error: 'Invalid phone number' },
                { status: 400 }
            );
        }

        // Get authenticated user
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get the connection to verify ownership and get connection_id
        const { data: connection, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, instance_name')
            .eq('user_id', userId)
            .eq('instance_name', instance_name)
            .single();

        if (connError || !connection) {
            return NextResponse.json(
                { error: 'Connection not found or not authorized' },
                { status: 403 }
            );
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Check if contact already exists
        const { data: existingContact } = await chatSupabase
            .from('whatsapp_contacts')
            .select('id')
            .eq('whatsapp_number', cleanPhone)
            .single();

        let contactId;

        if (existingContact) {
            // Contact exists, just update name if provided
            contactId = existingContact.id;
            await chatSupabase
                .from('whatsapp_contacts')
                .update({
                    name,
                    origin_id: origin_id || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contactId);
        } else {
            // Create new contact
            const { data: newContact, error: contactError } = await chatSupabase
                .from('whatsapp_contacts')
                .insert({
                    whatsapp_number: cleanPhone,
                    name,
                    origin_id: origin_id || null,
                    jid: `${cleanPhone.replace('+', '')}@s.whatsapp.net`
                })
                .select()
                .single();

            if (contactError) {
                console.error('Error creating contact:', contactError);
                return NextResponse.json({ error: 'Error creating contact' }, { status: 500 });
            }

            contactId = newContact.id;
        }

        // Check if conversation already exists for this contact + instance
        const { data: existingConv } = await chatSupabase
            .from('whatsapp_conversations')
            .select('id')
            .eq('instance_name', instance_name)
            .eq('contact_id', contactId)
            .single();

        if (existingConv) {
            // Conversation exists, update funnel_stage if provided
            if (funnel_stage) {
                await chatSupabase
                    .from('whatsapp_conversations')
                    .update({
                        funnel_stage,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingConv.id);
            }

            return NextResponse.json({
                success: true,
                contact_id: contactId,
                conversation_id: existingConv.id,
                message: 'Contact/conversation already exists, updated'
            });
        }

        // Create new conversation
        const { data: newConv, error: convError } = await chatSupabase
            .from('whatsapp_conversations')
            .insert({
                instance_name,
                connection_id: connection.id,
                user_id: userId,
                contact_id: contactId,
                funnel_stage: funnel_stage || 'novo',
                funnel_position: 0
            })
            .select()
            .single();

        if (convError) {
            console.error('Error creating conversation:', convError);
            return NextResponse.json({ error: 'Error creating conversation' }, { status: 500 });
        }

        // Log to history
        await chatSupabase
            .from('funnel_stage_history')
            .insert({
                entity_type: 'conversation',
                entity_id: newConv.id,
                from_stage: null,
                to_stage: funnel_stage || 'novo',
                notes: 'Criado manualmente'
            });

        return NextResponse.json({
            success: true,
            contact_id: contactId,
            conversation_id: newConv.id,
            message: 'Contact and conversation created'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating contact:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
