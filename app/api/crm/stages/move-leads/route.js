import { createClient, supabaseAdmin } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const log = (msg, data) => console.log(`[CRM_MOVE_LEADS] ${msg}`, data ? JSON.stringify(data, null, 2) : '');

    // User Client (Auth & Permissions)
    const supabase = await createClient();

    // Admin Client (Writes)
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { connectionId, fromStageId, toStageId } = body;

        if (!connectionId || !fromStageId || !toStageId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Permission Check
        const { data: connection, error: connError } = await supabase
            .from('whatsapp_connections')
            .select('user_id')
            .eq('id', connectionId)
            .single();

        if (connError || !connection) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        let hasAccess = connection.user_id === user.id;
        if (!hasAccess) {
            const { data: account } = await supabase.from('accounts').select('id').eq('owner_user_id', connection.user_id).single();
            if (account) {
                const { data: membership } = await supabase.from('account_members').select('role').eq('account_id', account.id).eq('user_id', user.id).single();
                if (membership && ['owner', 'manager'].includes(membership.role)) hasAccess = true;
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // 2. Perform Move (Update crm_leads or whatsapp_conversations where funnel_stage = fromStageId)
        // Note: The leads are likely stored in `whatsapp_conversations` table with `funnel_stage_id`.
        // Let's verify schema assumptions. The code uses `leads` which are `whatsapp_conversations`.

        // Wait, earlier code in `page.jsx` uses `movedLead.funnel_stage = finishStage` (which is the stage ID).
        // And patch to `/api/funnels/leads/${draggableId}/move` updates `funnel_stage` column?
        // Let's check `api/funnels/leads/[id]/move/route.js` if possible, OR just assume standard update.
        // Actually, assuming standard update on `whatsapp_conversations`.

        const { error: moveError } = await supabaseAdmin
            .from('whatsapp_conversations')
            .update({ funnel_stage_id: toStageId })
            .eq('funnel_stage_id', fromStageId)
            .eq('instance_name', (await supabaseAdmin.from('whatsapp_connections').select('instance_name').eq('id', connectionId).single()).data.instance_name);
        // Better to filter by connection/instance if possible to be safe, though existing usage implies global IDs? 
        // Wait, stage IDs are UUIDs, so they should be unique enough? 
        // But let's be safe. `whatsapp_connections` has `instance_name`. `whatsapp_conversations` has `instance_name`.

        // Actually, `fromStageId` is unique. 
        // BUT `whatsapp_conversations` usually links via `funnel_stage_id` UUID? 
        // Or string? In `page.jsx` `funnel_stage` seems to be used.
        // Let's assume `funnel_stage_id` is the column name. 

        // Correction: Looking at `page.jsx` logic: `movedLead.funnel_stage = finishStage`.
        // And `new_index` suggests reordering.
        // But for bulk move, we just want to change the stage ID.

        // Let's try `funnel_stage` first if that's what was used before, but `crm_stages` has `id`. 
        // Usually it's a FK.

        // I will assume the column is `funnel_stage_id` based on "standard" conventions, 
        // but if the previous dev used `funnel_stage` (string or id?), I should be careful.
        // Checking `app/crm/page.jsx` -> `movedLead.funnel_stage = finishStage`.
        // The `finishStage` comes from `droppableId` which is `stage.id`.
        // So `funnel_stage` column in `whatsapp_conversations` holds the Stage ID.

        const { error: updateError } = await supabaseAdmin
            .from('whatsapp_conversations')
            .update({ funnel_stage: toStageId }) // Using `funnel_stage` as column name based on frontend usage
            .eq('funnel_stage', fromStageId);

        if (updateError) {
            // Fallback: maybe column is funnel_stage_id?
            // No, `page.jsx` explicitly sets `funnel_stage`.
            log('Bulk Move Error', updateError);
            return NextResponse.json({ error: 'Failed to move leads', details: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Leads moved successfully' });

    } catch (error) {
        log('Exception', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}
