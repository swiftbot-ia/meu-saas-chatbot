import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

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

        // Build query
        let query = supabase
            .from('whatsapp_conversations')
            .select(`*, contact:whatsapp_contacts(*)`)
            .eq('instance_name', instanceName);

        // If specific stage requested, filter by it
        if (stage) {
            query = query.eq('funnel_stage', stage || 'novo');
        }

        // If cursor provided, paginate (cursor = last_message_at timestamp)
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

        // If specific stage requested, return simple structure
        if (stage) {
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

        // Group by funnel_stage for initial load (all stages)
        const groupedConversations = leads.reduce((acc, conv) => {
            const stageKey = conv.funnel_stage || 'novo';

            if (!acc[stageKey]) {
                acc[stageKey] = {
                    leads: [],
                    hasMore: false,
                    nextCursor: null
                };
            }

            acc[stageKey].leads.push({
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
            });

            return acc;
        }, {});

        // For initial load, mark all stages as potentially having more
        // (They'll check individually on scroll)
        Object.keys(groupedConversations).forEach(stageKey => {
            const stageLeads = groupedConversations[stageKey].leads;
            if (stageLeads.length >= limit) {
                groupedConversations[stageKey].hasMore = true;
                groupedConversations[stageKey].nextCursor = stageLeads[stageLeads.length - 1].last_message_at;
            }
        });

        return NextResponse.json(groupedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
