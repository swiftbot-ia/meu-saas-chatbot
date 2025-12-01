import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
    const { id } = await params;
    const { to_stage, notes, new_index } = await request.json();
    const supabase = createChatSupabaseClient();

    try {
        // 1. Get current state
        const { data: conversation, error: fetchError } = await supabase
            .from('whatsapp_conversations')
            .select('funnel_stage, funnel_position')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const from_stage = conversation.funnel_stage || 'novo';

        // 2. Get all items in the destination stage to calculate new positions
        const { data: stageItems, error: listError } = await supabase
            .from('whatsapp_conversations')
            .select('id, funnel_position')
            .eq('funnel_stage', to_stage)
            .order('funnel_position', { ascending: true })
            .order('last_message_at', { ascending: false });

        if (listError) throw listError;

        // 3. Calculate new positions
        // Remove the item if it's already in the list (same stage move)
        const items = stageItems.filter(item => item.id !== id);

        // Insert at new index
        // Ensure index is within bounds
        const insertIndex = Math.max(0, Math.min(new_index ?? items.length, items.length));
        items.splice(insertIndex, 0, { id });

        // 4. Update positions for all affected items
        const updates = items.map((item, index) => ({
            id: item.id,
            funnel_position: index,
            funnel_stage: to_stage // Ensure stage is set correctly
        }));

        // Perform bulk update (or individual updates if bulk not supported easily via client)
        // Perform bulk update
        const updatePromises = updates.map(update =>
            supabase
                .from('whatsapp_conversations')
                .update({
                    funnel_stage: update.funnel_stage,
                    funnel_position: update.funnel_position
                })
                .eq('id', update.id)
        );

        const results = await Promise.all(updatePromises);

        // Check for errors in results
        const updateErrors = results.filter(r => r.error);
        if (updateErrors.length > 0) {
            console.error('Errors updating positions:', updateErrors.map(e => e.error));
            throw new Error('Failed to update card positions due to database permissions.');
        }

        console.log(`Updated positions for ${results.length} items.`);

        // 5. Record history (only if stage changed)
        if (from_stage !== to_stage) {
            const { error: historyError } = await supabase
                .from('funnel_stage_history')
                .insert({
                    entity_type: 'conversation',
                    entity_id: id,
                    from_stage,
                    to_stage,
                    notes
                });

            if (historyError) {
                console.error('Error recording history:', historyError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error moving conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
