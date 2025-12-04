/**
 * Contacts API Route
 * GET /api/contacts - Lista contatos com filtros
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper para criar cliente Supabase com cookies (para autenticação)
function createAuthClient() {
    const cookieStore = cookies();
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
        const { searchParams } = new URL(request.url);
        const connectionId = searchParams.get('connectionId') || '';
        const originId = searchParams.get('originId') || '';
        const tagId = searchParams.get('tagId') || '';

        // Get authenticated user
        const supabase = createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get user's connections to filter by instance_name
        const { data: connections, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, instance_name')
            .eq('user_id', userId);

        if (connError) {
            console.error('Erro ao buscar conexões:', connError);
            return NextResponse.json({ error: 'Erro ao buscar conexões' }, { status: 500 });
        }

        // If a specific connection is selected, use only that one
        let instanceNames = [];
        if (connectionId) {
            const selectedConn = connections?.find(c => c.id === connectionId);
            if (selectedConn) {
                instanceNames = [selectedConn.instance_name];
            }
        } else {
            instanceNames = connections?.map(c => c.instance_name) || [];
        }

        if (instanceNames.length === 0) {
            return NextResponse.json({ contacts: [], origins: [], tags: [] });
        }

        // Use chat supabase for whatsapp tables
        const chatSupabase = createChatSupabaseAdminClient();

        // Build query for contacts with conversations and origin
        let query = chatSupabase
            .from('whatsapp_conversations')
            .select(`
                id,
                instance_name,
                funnel_stage,
                funnel_position,
                last_message_at,
                last_message_preview,
                contact:whatsapp_contacts!contact_id (
                    id,
                    whatsapp_number,
                    name,
                    profile_pic_url,
                    created_at,
                    last_message_at,
                    metadata,
                    origin_id,
                    origin:contact_origins!origin_id (
                        id,
                        name
                    )
                )
            `)
            .in('instance_name', instanceNames)
            .order('last_message_at', { ascending: false });

        const { data: conversations, error: convError } = await query;

        if (convError) {
            console.error('Erro ao buscar contatos:', convError);
            return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 });
        }

        // Get all origins for this user
        const { data: allOrigins, error: originsError } = await chatSupabase
            .from('contact_origins')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (originsError) {
            console.error('Erro ao buscar origens:', originsError);
        }

        // Get all tags
        const { data: allTags, error: tagsError } = await chatSupabase
            .from('contact_tags')
            .select('*')
            .order('name');

        if (tagsError) {
            console.error('Erro ao buscar tags:', tagsError);
        }

        // Get tag assignments for all contacts
        const contactIds = conversations?.map(c => c.contact?.id).filter(Boolean) || [];

        let tagAssignments = [];
        if (contactIds.length > 0) {
            const { data: assignments, error: assignError } = await chatSupabase
                .from('contact_tag_assignments')
                .select(`
                    contact_id,
                    tag:contact_tags (
                        id,
                        name,
                        color
                    )
                `)
                .in('contact_id', contactIds);

            if (!assignError) {
                tagAssignments = assignments || [];
            }
        }

        // Build contacts array with tags and origin
        let contacts = conversations?.map(conv => {
            const contactTags = tagAssignments
                .filter(a => a.contact_id === conv.contact?.id)
                .map(a => a.tag);

            return {
                id: conv.contact?.id,
                conversation_id: conv.id,
                whatsapp_number: conv.contact?.whatsapp_number,
                name: conv.contact?.name,
                profile_pic_url: conv.contact?.profile_pic_url,
                created_at: conv.contact?.created_at,
                last_message_at: conv.last_message_at || conv.contact?.last_message_at,
                last_message_preview: conv.last_message_preview,
                instance_name: conv.instance_name,
                funnel_stage: conv.funnel_stage,
                funnel_position: conv.funnel_position,
                metadata: conv.contact?.metadata,
                origin: conv.contact?.origin || null,
                tags: contactTags
            };
        }) || [];

        // Filter by origin
        if (originId) {
            contacts = contacts.filter(c => c.origin?.id === originId);
        }

        // Filter by tag
        if (tagId) {
            contacts = contacts.filter(c =>
                c.tags?.some(t => t.id === tagId)
            );
        }

        return NextResponse.json({
            contacts,
            origins: allOrigins || [],
            tags: allTags || []
        });

    } catch (error) {
        console.error('Erro na API de contatos:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
