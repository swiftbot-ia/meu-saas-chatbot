import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

const SALES_STAGES = ['novo', 'apresentacao', 'negociacao', 'fechamento'];

// Helper to apply filters to a query
function applyFilters(query, filters) {
    const {
        date_from, date_to,
        won_from, won_to,
        lost_from, lost_to,
        origin_id, tag_id,
        status,
        include_manual // include manually created (no messages)
    } = filters;

    // Date filters (created_at)
    if (date_from) {
        query = query.gte('created_at', date_from);
    }
    if (date_to) {
        query = query.lte('created_at', date_to);
    }

    // Won date filters
    if (won_from) {
        query = query.gte('won_at', won_from);
    }
    if (won_to) {
        query = query.lte('won_at', won_to);
    }

    // Lost date filters
    if (lost_from) {
        query = query.gte('lost_at', lost_from);
    }
    if (lost_to) {
        query = query.lte('lost_at', lost_to);
    }

    // Status filter
    if (status === 'won') {
        query = query.not('won_at', 'is', null);
    } else if (status === 'lost') {
        query = query.not('lost_at', 'is', null);
    } else if (status === 'active') {
        query = query.is('won_at', null).is('lost_at', null);
    }
    // 'all' = no filter

    // Only include conversations with messages (unless include_manual is true)
    if (!include_manual) {
        query = query.not('last_message_at', 'is', null);
    }

    return query;
}

export async function GET(request) {
    const supabase = createChatSupabaseClient();

    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const instanceName = searchParams.get('instance_name');
        const limit = parseInt(searchParams.get('limit') || '20');
        const stage = searchParams.get('stage'); // optional: specific stage
        const cursor = searchParams.get('cursor'); // optional: pagination cursor

        // Filter parameters
        const filters = {
            date_from: searchParams.get('date_from'),
            date_to: searchParams.get('date_to'),
            won_from: searchParams.get('won_from'),
            won_to: searchParams.get('won_to'),
            lost_from: searchParams.get('lost_from'),
            lost_to: searchParams.get('lost_to'),
            origin_id: searchParams.get('origin_id'),
            tag_id: searchParams.get('tag_id'),
            status: searchParams.get('status') || 'all',
            include_manual: searchParams.get('include_manual') === 'true'
        };

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
                .select(`*, contact:whatsapp_contacts(*, origin:contact_origins(*))`)
                .eq('instance_name', instanceName)
                .eq('funnel_stage', stage || 'novo');

            // Apply filters
            query = applyFilters(query, filters);

            // Note: origin_id and tag_id filters are applied post-query

            // If cursor provided, paginate
            if (cursor) {
                query = query.lt('last_message_at', cursor);
            }

            // Order and limit
            query = query
                .order('funnel_position', { ascending: true })
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .limit(limit + 1);

            const { data: conversations, error } = await query;

            if (error) {
                throw error;
            }

            // Filter by tag if needed (post-query because of join complexity)
            let filteredConversations = conversations || [];

            // Filter by origin (post-query because Supabase doesn't support nested field filters)
            if (filters.origin_id) {
                filteredConversations = filteredConversations.filter(conv =>
                    conv.contact?.origin_id === filters.origin_id
                );
            }

            // Filter by tag
            if (filters.tag_id) {
                // Get contacts with this tag
                const { data: tagAssignments } = await supabase
                    .from('contact_tag_assignments')
                    .select('contact_id')
                    .eq('tag_id', filters.tag_id);

                const contactIdsWithTag = new Set(tagAssignments?.map(a => a.contact_id) || []);
                filteredConversations = filteredConversations.filter(conv =>
                    contactIdsWithTag.has(conv.contact?.id)
                );
            }

            // Check if there are more results
            const hasMore = filteredConversations.length > limit;
            const leads = hasMore ? filteredConversations.slice(0, limit) : filteredConversations;
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
                created_at: conv.created_at,
                won_at: conv.won_at,
                lost_at: conv.lost_at,
                lost_reason: conv.lost_reason,
                origin: conv.contact?.origin
            }));

            return NextResponse.json({
                leads: formattedLeads,
                hasMore,
                nextCursor
            });
        }

        // INITIAL LOAD: Fetch 20 leads PER STAGE
        const groupedConversations = {};

        // Get tag assignments for filtering if needed
        let contactIdsWithTag = null;
        if (filters.tag_id) {
            const { data: tagAssignments } = await supabase
                .from('contact_tag_assignments')
                .select('contact_id')
                .eq('tag_id', filters.tag_id);
            contactIdsWithTag = new Set(tagAssignments?.map(a => a.contact_id) || []);
        }

        for (const stageKey of SALES_STAGES) {
            // Build count query with filters
            let countQuery = supabase
                .from('whatsapp_conversations')
                .select('*', { count: 'exact', head: true })
                .eq('instance_name', instanceName)
                .eq('funnel_stage', stageKey);

            countQuery = applyFilters(countQuery, filters);
            const { count: totalCount } = await countQuery;

            // Build main query
            let query = supabase
                .from('whatsapp_conversations')
                .select(`*, contact:whatsapp_contacts(*, origin:contact_origins(*))`)
                .eq('instance_name', instanceName)
                .eq('funnel_stage', stageKey);

            // Apply filters
            query = applyFilters(query, filters);

            // Note: origin_id and tag_id filters are applied post-query

            query = query
                .order('funnel_position', { ascending: true })
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .limit(limit + 1);

            const { data: conversations, error } = await query;

            if (error) {
                console.error(`Error fetching stage ${stageKey}:`, error);
                continue;
            }

            // Filter by origin (post-query filtering)
            let filteredConversations = conversations || [];
            if (filters.origin_id) {
                filteredConversations = filteredConversations.filter(conv =>
                    conv.contact?.origin_id === filters.origin_id
                );
            }

            // Filter by tag if needed
            if (contactIdsWithTag) {
                filteredConversations = filteredConversations.filter(conv =>
                    contactIdsWithTag.has(conv.contact?.id)
                );
            }

            // Check if there are more results for this stage
            const hasMore = filteredConversations.length > limit;
            const leads = hasMore ? filteredConversations.slice(0, limit) : filteredConversations;
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
                    created_at: conv.created_at,
                    won_at: conv.won_at,
                    lost_at: conv.lost_at,
                    lost_reason: conv.lost_reason,
                    origin: conv.contact?.origin
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
