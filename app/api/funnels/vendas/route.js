import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createChatSupabaseClient();

    try {
        // Fetch conversations with contact details
        const { data: conversations, error } = await supabase
            .from('whatsapp_conversations')
            .select(`
        *,
        contact:whatsapp_contacts(*)
      `)
            .order('funnel_position', { ascending: true })
            .order('last_message_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Group by funnel_stage
        const groupedConversations = conversations.reduce((acc, conv) => {
            // Default to 'novo' if null
            const stage = conv.funnel_stage || 'novo';

            if (!acc[stage]) {
                acc[stage] = [];
            }

            // Format as "lead" for the frontend
            acc[stage].push({
                id: conv.id,
                name: conv.contact?.name || conv.contact?.whatsapp_number || 'Sem nome',
                phone: conv.contact?.whatsapp_number,
                email: conv.contact?.email,
                profile_pic_url: conv.contact?.profile_pic_url,
                funnel_stage: stage,
                unread_count: conv.unread_count,
                last_message: conv.last_message,
                last_message_at: conv.last_message_at,
                created_at: conv.created_at
            });
            return acc;
        }, {});

        return NextResponse.json(groupedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
