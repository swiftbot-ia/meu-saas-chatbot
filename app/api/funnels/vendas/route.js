import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

const SALES_STAGES = ['novo', 'apresentacao', 'negociacao', 'fechamento'];

export async function GET(request) {
    const supabase = createChatSupabaseClient();

    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const instanceName = searchParams.get('instance_name');
        const limit = parseInt(searchParams.get('limit') || '20');
        const stage = searchParams.get('stage'); // optional: specific stage
        const cursor = searchParams.get('cursor'); // optional: pagination cursor

        if (!instanceName) {
            return NextResponse.json(
                { error: 'instance_name parameter is required' },
                { status: 400 }
            );
        }

        // If specific stage requested (for load more)
        if (stage) {
            let query = supabase
                .from('whatsapp_conversations')
                .select(`*, contact:whatsapp_contacts(*)`)
                .eq('instance_name', instanceName)
                .eq('funnel_stage', stage || 'novo')
                .not('last_message_at', 'is', null); // Apenas conversas com mensagens

            // If cursor provided, paginate
            if (cursor) {
                query = query.lt('last_message_at', cursor);
            }

            // Order and limit
            query = query
                .order('funnel_position', { ascending: true })
                .order('last_message_at', { ascending: false })
                .limit(limit + 1); // Fetch one extra to check if there's more

            const { data: conversations, error } = await query;

            if (error) {
                throw error;
            }

            // Check if there are more results
            const hasMore = conversations.length > limit;
            const leads = hasMore ? conversations.slice(0, limit) : conversations;
            const nextCursor = hasMore && leads.length > 0
                ? leads[leads.length - 1].last_message_at
                : null;

            const formattedLeads = leads.map(conv => ({
                id: conv.id,
                name: conv.contact?.name || conv.contact?.whatsapp_number || 'Sem nome',
                phone: conv.contact?.whatsapp_number,
                email: conv.contact?.email,
                profile_pic_url: conv.contact?.profile_pic_url,
                funnel_stage: conv.funnel_stage || 'novo',
                unread_count: conv.unread_count,
                last_message: conv.last_message,
                last_message_at: conv.last_message_at,
                created_at: conv.created_at
            }));

            return NextResponse.json({
                leads: formattedLeads,
                hasMore,
                nextCursor
            });
        }

        // INITIAL LOAD: Fetch 20 leads PER STAGE
        const groupedConversations = {};

        for (const stageKey of SALES_STAGES) {
            // Buscar contagem total primeiro
            const { count: totalCount } = await supabase
                .from('whatsapp_conversations')
                .select('*', { count: 'exact', head: true })
                .eq('instance_name', instanceName)
                .eq('funnel_stage', stageKey)
                .not('last_message_at', 'is', null);

            const query = supabase
                .from('whatsapp_conversations')
                .select(`*, contact:whatsapp_contacts(*)`)
                .eq('instance_name', instanceName)
                .eq('funnel_stage', stageKey)
                .not('last_message_at', 'is', null) // Apenas conversas com mensagens
                .order('funnel_position', { ascending: true })
                .order('last_message_at', { ascending: false })
                .limit(limit + 1); // Fetch one extra to check if there's more

            const { data: conversations, error } = await query;

            if (error) {
                console.error(`Error fetching stage ${stageKey}:`, error);
                continue; // Skip this stage if error
            }

            // Check if there are more results for this stage
            const hasMore = conversations.length > limit;
            const leads = hasMore ? conversations.slice(0, limit) : conversations;
            const nextCursor = hasMore && leads.length > 0
                ? leads[leads.length - 1].last_message_at
                : null;

            groupedConversations[stageKey] = {
                leads: leads.map(conv => ({
                    id: conv.id,
                    name: conv.contact?.name || conv.contact?.whatsapp_number || 'Sem nome',
                    phone: conv.contact?.whatsapp_number,
                    email: conv.contact?.email,
                    profile_pic_url: conv.contact?.profile_pic_url,
                    funnel_stage: stageKey,
                    unread_count: conv.unread_count,
                    last_message: conv.last_message,
                    last_message_at: conv.last_message_at,
                    created_at: conv.created_at
                })),
                hasMore,
                nextCursor,
                totalCount: totalCount || 0
            };
        }

        return NextResponse.json(groupedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
