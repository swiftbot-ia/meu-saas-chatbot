import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
    const { entityType, entityId } = await params;
    const supabase = createChatSupabaseClient();

    try {
        const { data: history, error } = await supabase
            .from('funnel_stage_history')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
