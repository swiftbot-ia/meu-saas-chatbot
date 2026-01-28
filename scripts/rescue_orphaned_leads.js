require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixOrphanedLeads() {
    console.log('🚀 Starting Orphaned Leads Rescue...');

    // 1. Init Clients
    const mainUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const mainKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const chatUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
    const chatKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY;

    if (!mainUrl || !mainKey || !chatUrl || !chatKey) {
        console.error('❌ Missing environment variables (SUPABASE_URL or keys). Check .env.local');
        process.exit(1);
    }

    const mainClient = createClient(mainUrl, mainKey);
    const chatClient = createClient(chatUrl, chatKey);

    // 2. Fetch all connections from Main DB
    console.log('📥 Fetching connections from Main DB...');
    const { data: connections, error: connError } = await mainClient
        .from('whatsapp_connections')
        .select('id, instance_name');

    if (connError) {
        console.error('❌ Error fetching connections:', connError);
        process.exit(1);
    }

    console.log(`✅ Found ${connections.length} connections.`);

    // 3. Process each connection
    for (const conn of connections) {
        console.log(`\n🔹 Processing connection: ${conn.instance_name} (${conn.id})`);

        // A. Get 'Novo' stage ID for this connection
        const { data: stages, error: stageError } = await mainClient
            .from('crm_stages')
            .select('id')
            .eq('connection_id', conn.id)
            .eq('stage_key', 'novo')
            .single();

        if (stageError || !stages) {
            console.log(`   🔸 'Novo' stage not found. Skipping.`);
            continue;
        }

        const novoStageId = stages.id;
        console.log(`   ✅ 'Novo' stage ID: ${novoStageId}`);

        // B. Update Chat DB conversations (orphans)
        // We look for conversations matching this instance_name AND funnel_stage is NULL
        // Note: 'funnel_stage' column in Chat DB must match the type (UUID/Text). Assuming compatible.

        // B. Update Chat DB conversations (orphans)
        // 1. Find columns to update
        const { data: candidates, error: searchError } = await chatClient
            .from('whatsapp_conversations')
            .select('id')
            .eq('instance_name', conn.instance_name)
            .or('funnel_stage.is.null,funnel_stage.eq.novo,funnel_stage.eq.undefined');

        if (searchError) {
            console.error(`   ❌ Error searching leads:`, searchError.message);
            continue;
        }

        if (!candidates || candidates.length === 0) {
            console.log(`   ✨ No orphaned leads found.`);
            continue;
        }

        const idsToUpdate = candidates.map(c => c.id);

        // 2. Bulk Update
        const { data: updateData, error: updateError } = await chatClient
            .from('whatsapp_conversations')
            .update({ funnel_stage: novoStageId })
            .in('id', idsToUpdate)
            .select('id');

        if (updateError) {
            console.error(`   ❌ Error updating leads:`, updateError.message);
        } else {
            console.log(`   🎉 Fixed ${updateData.length} orphaned leads.`);
        }
    }

    console.log('\n🏁 Rescue Operation Completed.');
}

fixOrphanedLeads();
