/**
 * Debug Endpoint: Test Chat Database Connection
 * Access: GET /api/debug/chat-db
 */

import { NextResponse } from 'next/server';
import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

export async function GET(request) {
  const results = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Check environment variables
    results.steps.push({
      step: 1,
      name: 'Environment Variables',
      chatUrl: process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
      chatKey: process.env.NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
      url: process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
    });

    // Step 2: Get authenticated user
    const cookieStore = await cookies();
    const mainSupabase = createServerSupabaseClient(cookieStore);
    const { data: { user }, error: authError } = await mainSupabase.auth.getUser();

    results.steps.push({
      step: 2,
      name: 'Authentication',
      status: user ? '✅ Authenticated' : '❌ Not authenticated',
      userId: user?.id,
      userEmail: user?.email,
      error: authError?.message
    });

    // Step 3: Create chat client
    let chatSupabase;
    try {
      chatSupabase = createChatSupabaseClient();
      results.steps.push({
        step: 3,
        name: 'Chat Client',
        status: '✅ Created successfully'
      });
    } catch (error) {
      results.steps.push({
        step: 3,
        name: 'Chat Client',
        status: '❌ Failed to create',
        error: error.message
      });
      return NextResponse.json(results, { status: 500 });
    }

    // Step 4: Test whatsapp_contacts table
    const { data: contacts, error: contactsError, count: contactsCount } = await chatSupabase
      .from('whatsapp_contacts')
      .select('*', { count: 'exact' })
      .limit(5);

    results.steps.push({
      step: 4,
      name: 'whatsapp_contacts',
      status: contactsError ? '❌ Error' : '✅ Success',
      totalRecords: contactsCount,
      sampleCount: contacts?.length || 0,
      error: contactsError?.message,
      sample: contacts?.[0]
    });

    // Step 5: Test whatsapp_conversations table
    const { data: conversations, error: conversationsError, count: conversationsCount } = await chatSupabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact' })
      .limit(5);

    results.steps.push({
      step: 5,
      name: 'whatsapp_conversations',
      status: conversationsError ? '❌ Error' : '✅ Success',
      totalRecords: conversationsCount,
      sampleCount: conversations?.length || 0,
      error: conversationsError?.message,
      sample: conversations?.[0]
    });

    // Step 6: Test whatsapp_conversations with user filter (RLS test)
    if (user) {
      const { data: userConversations, error: userConvError, count: userConvCount } = await chatSupabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .limit(5);

      results.steps.push({
        step: 6,
        name: 'whatsapp_conversations (user filter)',
        status: userConvError ? '❌ Error' : '✅ Success',
        userId: user.id,
        totalRecords: userConvCount,
        sampleCount: userConversations?.length || 0,
        error: userConvError?.message,
        sample: userConversations?.[0]
      });
    }

    // Step 7: Test whatsapp_messages table
    const { data: messages, error: messagesError, count: messagesCount } = await chatSupabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .limit(5);

    results.steps.push({
      step: 7,
      name: 'whatsapp_messages',
      status: messagesError ? '❌ Error' : '✅ Success',
      totalRecords: messagesCount,
      sampleCount: messages?.length || 0,
      error: messagesError?.message,
      sample: messages?.[0]
    });

    // Step 8: Get WhatsApp connections from main DB
    if (user) {
      const { data: connections, error: connectionsError } = await mainSupabase
        .from('whatsapp_connections')
        .select('id, instance_name, phone_number_id, is_connected')
        .eq('user_id', user.id);

      results.steps.push({
        step: 8,
        name: 'whatsapp_connections (main DB)',
        status: connectionsError ? '❌ Error' : '✅ Success',
        totalRecords: connections?.length || 0,
        error: connectionsError?.message,
        connections: connections
      });

      // Check if conversations exist for these instance names
      if (connections && connections.length > 0) {
        const instanceNames = connections.map(c => c.instance_name);
        const { data: convByInstance, error: convByInstanceError, count: convByInstanceCount } = await chatSupabase
          .from('whatsapp_conversations')
          .select('instance_name', { count: 'exact' })
          .in('instance_name', instanceNames);

        results.steps.push({
          step: 9,
          name: 'Conversations by instance_name',
          status: convByInstanceError ? '❌ Error' : '✅ Success',
          instanceNames: instanceNames,
          matchingConversations: convByInstanceCount,
          error: convByInstanceError?.message
        });
      }
    }

    // Summary
    results.summary = {
      authenticated: !!user,
      chatDbConfigured: !!chatSupabase,
      totalContacts: contactsCount || 0,
      totalConversations: conversationsCount || 0,
      totalMessages: messagesCount || 0,
      diagnosis: conversationsCount === 0 ?
        '⚠️ No conversations found in database. This is why the UI shows no conversations.' :
        '✅ Database has conversations. Check user_id and instance_name matching.'
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    results.steps.push({
      step: 'error',
      name: 'Critical Error',
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(results, { status: 500 });
  }
}
