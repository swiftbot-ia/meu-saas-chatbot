require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function inspectChatDB() {
    console.log('🔍 Inspecting Chat DB...');

    const chatUrl = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL;
    const chatKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY;

    if (!chatUrl || !chatKey) {
        console.error('❌ Missing Chat DB creds');
        return;
    }

    const chatClient = createClient(chatUrl, chatKey);

    // Fetch one row to see structure
    const { data: sample, error } = await chatClient
        .from('whatsapp_conversations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching sample:', error);
        return;
    }

    if (sample && sample.length > 0) {
        console.log('✅ Sample Row Keys:', Object.keys(sample[0]));
    } else {
        console.log('⚠️ No rows found, cannot inspect keys via select.');
    }
}

inspectChatDB();
