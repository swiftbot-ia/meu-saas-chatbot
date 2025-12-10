import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST - Mark lead as lost
export async function POST(request, { params }) {
    const supabase = createChatSupabaseClient();

    try {
        const { id } = await params;
        const body = await request.json();
        const { reason } = body;

        const { data, error } = await supabase
            .from('whatsapp_conversations')
            .update({
                lost_at: new Date().toISOString(),
                lost_reason: reason || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Also log to history
        await supabase
            .from('funnel_stage_history')
            .insert({
                entity_type: 'conversation',
                entity_id: id,
                from_stage: data.funnel_stage,
                to_stage: 'perdido',
                notes: reason ? `Marcado como perdido: ${reason}` : 'Marcado como perdido'
            });

        return NextResponse.json({ success: true, conversation: data });
    } catch (error) {
        console.error('Error marking lead as lost:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove lost status (reactivate opportunity)
export async function DELETE(request, { params }) {
    const supabase = createChatSupabaseClient();

    try {
        const { id } = await params;

        const { data, error } = await supabase
            .from('whatsapp_conversations')
            .update({
                lost_at: null,
                lost_reason: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Log to history
        await supabase
            .from('funnel_stage_history')
            .insert({
                entity_type: 'conversation',
                entity_id: id,
                from_stage: 'perdido',
                to_stage: data.funnel_stage,
                notes: 'Reativado - removido status de perdido'
            });

        return NextResponse.json({ success: true, conversation: data });
    } catch (error) {
        console.error('Error reactivating lead:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
