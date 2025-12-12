/**
 * Contacts API Route
 * GET /api/contacts - Lista contatos com filtros
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';
import { getOwnerUserIdFromMember } from '@/lib/account-service';

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

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const connectionId = searchParams.get('connectionId') || '';
        const originId = searchParams.get('originId') || '';
        const tagId = searchParams.get('tagId') || '';

        // Get authenticated user
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get owner's user ID for team data sharing
        let ownerUserId = userId;
        try {
            const ownerFromService = await getOwnerUserIdFromMember(userId);
            if (ownerFromService) {
                ownerUserId = ownerFromService;
                if (ownerUserId !== userId) {
                    console.log('👥 [Contacts] Team member, using owner data:', ownerUserId);
                }
            }
        } catch (accountError) {
            console.log('⚠️ [Contacts] Account check failed:', accountError.message);
        }

        // Get owner's connections to filter by instance_name
        const { data: connections, error: connError } = await supabaseAdmin
            .from('whatsapp_connections')
            .select('id, instance_name')
            .eq('user_id', ownerUserId);

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

        // Build query for contacts DIRECTLY from whatsapp_contacts (not via conversations)
        // This ensures all contacts appear, even those without conversations
        let contactsQuery = chatSupabase
            .from('whatsapp_contacts')
            .select(`
                id,
                whatsapp_number,
                name,
                profile_pic_url,
                created_at,
                last_message_at,
                metadata,
                instance_name,
                origin_id,
                origin:contact_origins!origin_id (
                    id,
                    name
                )
            `)
            .in('instance_name', instanceNames)
            .order('last_message_at', { ascending: false, nullsFirst: false });

        const { data: contactsData, error: contactsError } = await contactsQuery;

        if (contactsError) {
            console.error('Erro ao buscar contatos:', contactsError);
            return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 });
        }

        // Get conversations for these contacts to get funnel info
        const contactIds = contactsData?.map(c => c.id).filter(Boolean) || [];

        let conversationsMap = {};
        if (contactIds.length > 0) {
            const { data: convData } = await chatSupabase
                .from('whatsapp_conversations')
                .select('id, contact_id, funnel_stage, funnel_position, last_message_preview')
                .in('contact_id', contactIds);

            if (convData) {
                convData.forEach(conv => {
                    conversationsMap[conv.contact_id] = conv;
                });
            }
        }

        // Get all origins for these instances (per instance, like tags)
        const { data: allOrigins, error: originsError } = await chatSupabase
            .from('contact_origins')
            .select('*')
            .in('instance_name', instanceNames)
            .order('name');

        if (originsError) {
            console.error('Erro ao buscar origens:', originsError);
        }

        // Get all tags for these instances (per instance)
        const { data: allTags, error: tagsError } = await chatSupabase
            .from('contact_tags')
            .select('*')
            .in('instance_name', instanceNames)
            .order('name');

        if (tagsError) {
            console.error('Erro ao buscar tags:', tagsError);
        }

        // Get tag assignments for all contacts
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

        // Build contacts array with tags, origin and conversation data
        let contacts = contactsData?.map(contact => {
            const contactTags = tagAssignments
                .filter(a => a.contact_id === contact.id)
                .map(a => a.tag);

            const conv = conversationsMap[contact.id];

            return {
                id: contact.id,
                conversation_id: conv?.id || null,
                whatsapp_number: contact.whatsapp_number,
                name: contact.name,
                profile_pic_url: contact.profile_pic_url,
                created_at: contact.created_at,
                last_message_at: contact.last_message_at,
                last_message_preview: conv?.last_message_preview || null,
                instance_name: contact.instance_name,
                funnel_stage: conv?.funnel_stage || null,
                funnel_position: conv?.funnel_position || null,
                metadata: contact.metadata,
                origin: contact.origin || null,
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
