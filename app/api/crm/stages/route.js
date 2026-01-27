import { createClient, supabaseAdmin } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { MAX_STAGES } from '@/app/crm/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
        return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    try {
        const { data: stages, error } = await supabase
            .from('crm_stages')
            .select('*')
            .eq('connection_id', connectionId)
            .order('position', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ stages });
    } catch (error) {
        console.error('Error fetching stages:', error);
        return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 });
    }
}

export async function POST(request) {
    // Debug log wrapper
    const log = (msg, data) => console.log(`[CRM_STAGES_POST] ${msg}`, data ? JSON.stringify(data, null, 2) : '');

    // User Client (for Auth & Permissions - via cookies)
    const supabase = await createClient();

    // Admin Client (for DB Writes - Bypasses RLS)
    if (!supabaseAdmin) {
        log('CRITICAL: supabaseAdmin not initialized');
        return NextResponse.json({ error: 'Server configuration error (Admin Client)' }, { status: 500 });
    }

    // 1. Auth Check
    let user;
    try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
            log('Auth Error', authError);
            return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
        }
        user = session.user;
    } catch (e) {
        log('Auth Exception', e);
        return NextResponse.json({ error: 'Auth check failed', details: e.message }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { connectionId, stages } = body;

        if (!connectionId || !Array.isArray(stages)) {
            return NextResponse.json({ error: 'Invalid data: connectionId and stages array required' }, { status: 400 });
        }

        if (stages.length > MAX_STAGES) {
            return NextResponse.json({ error: `Maximum of ${MAX_STAGES} stages allowed` }, { status: 400 });
        }

        // 2. Permission Check
        let hasAccess = false;
        try {
            // Fetch connection
            const { data: connection, error: connError } = await supabase
                .from('whatsapp_connections')
                .select('user_id, instance_name')
                .eq('id', connectionId)
                .maybeSingle();

            if (connError) {
                log('Connection Fetch Error', connError);
                return NextResponse.json({ error: 'Database error checking connection', details: connError.message }, { status: 500 });
            }

            if (!connection) {
                return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
            }

            // Direct ownership
            if (connection.user_id === user.id) {
                hasAccess = true;
            } else {
                // Team Check
                const { data: account } = await supabase
                    .from('accounts')
                    .select('id')
                    .eq('owner_user_id', connection.user_id)
                    .maybeSingle();

                if (account) {
                    const { data: membership } = await supabase
                        .from('account_members')
                        .select('role')
                        .eq('account_id', account.id)
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (membership && ['owner', 'manager'].includes(membership.role)) {
                        hasAccess = true;
                    }
                }
            }
        } catch (e) {
            log('Permission Exception', e);
            return NextResponse.json({ error: 'Permission check failed', details: e.message }, { status: 500 });
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'You do not have permission to manage this funnel' }, { status: 403 });
        }

        // 3. Data Prep
        const { data: existingStages, error: fetchError } = await supabaseAdmin
            .from('crm_stages')
            .select('id, stage_key')
            .eq('connection_id', connectionId);

        if (fetchError) {
            log('Fetch Stages Error (Admin)', fetchError);
            if (fetchError.code === '42P01') {
                return NextResponse.json({ error: 'Table crm_stages does not exist. Please run migration.' }, { status: 500 });
            }
            return NextResponse.json({ error: 'Failed to fetch existing stages', details: fetchError.message }, { status: 500 });
        }

        const newStageIds = new Set(stages.map(s => s.id).filter(id => id && !id.toString().startsWith('temp-')));
        const stagesToDelete = existingStages?.filter(s => !newStageIds.has(s.id)) || [];

        const stagesToUpdate = [];
        const stagesToInsert = [];

        stages.forEach((s, index) => {
            const commonData = {
                connection_id: connectionId,
                name: s.name,
                position: index,
                color_key: s.color_key,
                stage_key: s.stage_key || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            if (s.id && !s.id.toString().startsWith('temp-')) {
                stagesToUpdate.push({ ...commonData, id: s.id });
            } else {
                stagesToInsert.push(commonData);
            }
        });

        // 4. Execution (Using ADMIN Client)

        // A. Upsert Updates
        if (stagesToUpdate.length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('crm_stages')
                .upsert(stagesToUpdate);

            if (updateError) {
                log('Update Error (Admin)', updateError);
                return NextResponse.json({ error: 'Failed to update stages', details: updateError.message }, { status: 500 });
            }
        }

        // B. Insert New
        if (stagesToInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('crm_stages')
                .insert(stagesToInsert);

            if (insertError) {
                log('Insert Error (Admin)', insertError);
                return NextResponse.json({ error: 'Failed to create new stages', details: insertError.message }, { status: 500 });
            }
        }

        // C. Delete Removed
        if (stagesToDelete.length > 0) {
            const { error: deleteError } = await supabaseAdmin
                .from('crm_stages')
                .delete()
                .in('id', stagesToDelete.map(s => s.id));

            if (deleteError) {
                log('Delete Error (Admin)', deleteError);
                return NextResponse.json({ error: 'Failed to delete removed stages', details: deleteError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        log('Unhandled Top-Level Exception', error);
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
