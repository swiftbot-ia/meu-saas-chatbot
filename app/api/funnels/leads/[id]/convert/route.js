import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

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

        // 2. Create client
        const { data: client, error: createError } = await supabase
            .from('clients')
            .insert({
                name: conversation.contact?.name || conversation.contact?.whatsapp_number || 'Cliente',
                email: conversation.contact?.email,
                phone: conversation.contact?.whatsapp_number,
                conversation_id: conversation.id,
                funnel_stage: 'onboarding',
                status: 'active'
            })
            .select()
            .single();

        if (createError) throw createError;

        // 3. Update conversation stage
        const { error: updateError } = await supabase
            .from('whatsapp_conversations')
            .update({
                funnel_stage: 'fechamento'
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // 4. Record history
        await supabase.from('funnel_stage_history').insert({
            entity_type: 'conversation',
            entity_id: id,
            from_stage: conversation.funnel_stage,
            to_stage: 'converted',
            notes: 'Converted to client'
        });

        return NextResponse.json({ success: true, client });
    } catch (error) {
        console.error('Error converting conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
