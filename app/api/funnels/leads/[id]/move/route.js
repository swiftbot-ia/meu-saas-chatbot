import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';
import TriggerEngine from '@/lib/TriggerEngine';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
    const { id } = await params;
    const { to_stage, notes, new_index } = await request.json();
    const supabase = createChatSupabaseClient();

    try {
        console.log(`[MoveLead] Starting move for ID: ${id} to stage: ${to_stage}`);
        // 1. Get current state
        const { data: conversation, error: fetchError } = await supabase
            .from('whatsapp_conversations')
            .select('funnel_stage, funnel_position, connection_id, contact_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Fetch related data manually (avoid embedding errors if FK missing in schema cache)
        const { data: contact } = await supabase
            .from('whatsapp_contacts')
            .select('*')
            .eq('id', conversation.contact_id)
            .single();

        const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('*')
            .eq('id', conversation.connection_id)
            .single();

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

            // 6. Fire Triggers
            if (conversation.connection_id) {
                const payload = {
                    toStage: to_stage,
                    fromStage: from_stage,
                    contactId: conversation.contact_id,
                    conversationId: id,
                    contact: contact,
                    connection: connection
                };

                // Generic stage change
                console.log('[MoveLead] Firing funnel_stage_changed trigger');
                await TriggerEngine.processEvent('funnel_stage_changed', payload, conversation.connection_id);


                // Specific status triggers
                if (to_stage === 'ganho' || to_stage === 'won') {
                    await TriggerEngine.processEvent('deal_won', payload, conversation.connection_id);
                } else if (to_stage === 'perdido' || to_stage === 'lost') {
                    await TriggerEngine.processEvent('deal_lost', payload, conversation.connection_id);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error moving conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
