import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
    const { id } = await params;
    const supabase = createChatSupabaseClient();

    try {
        // 1. Get conversation and contact data
        const { data: conversation, error: fetchError } = await supabase
            .from('whatsapp_conversations')
            .select(`
                *,
                contact: whatsapp_contacts(*)
            `)
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Update conversation - set won_at and update stage to fechamento
        const { data: updatedConversation, error: updateError } = await supabase
            .from('whatsapp_conversations')
            .update({
                funnel_stage: 'fechamento',
                won_at: new Date().toISOString(),
                lost_at: null, // Clear any lost status
                lost_reason: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 3. Record history
        await supabase.from('funnel_stage_history').insert({
            entity_type: 'conversation',
            entity_id: id,
            from_stage: conversation.funnel_stage,
            to_stage: 'fechamento',
            notes: 'Convertido em cliente - marcado como ganho'
        });

        return NextResponse.json({
            success: true,
            conversation: updatedConversation
        });
    } catch (error) {
        console.error('Error converting conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
