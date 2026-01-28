
import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { id } = await params;
  const { rating, correct_response } = await request.json();
  const supabase = createChatSupabaseClient();

  try {
    // 1. Fetch message details
    const { data: message, error: msgError } = await supabase
      .from('whatsapp_messages')
      .select('*, whatsapp_conversations!inner(*)')
      .eq('id', id)
      .single();

    if (msgError) throw msgError;

    // 2. Fetch original input (last user message before this one in the same conversation)
    // Only if rating is 'dislike' and we want to capture context
    let original_input = null;
    if (message.conversation_id) {
      const { data: prevMessage } = await supabase
        .from('whatsapp_messages')
        .select('message_content')
        .eq('conversation_id', message.conversation_id)
        .lt('received_at', message.received_at)
        .eq('direction', 'inbound')
        .order('received_at', { ascending: false })
        .limit(1)
        .single();

      if (prevMessage) original_input = prevMessage.message_content;
    }

    // 3. Upsert feedback
    // We use good_responses table, but maybe also update metadata on the message itself?
    // MessageBubble expects "feedback_rating" on the message object, so we should update the message metadata too

    // Update message metadata
    const metadata = message.metadata || {};
    metadata.feedback_rating = rating;
    metadata.correct_response = correct_response;

    const { error: updateError } = await supabase
      .from('whatsapp_messages')
      .update({ metadata })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log to good_responses if it's a correction
    if (rating === 'dislike' && correct_response) {
      const { error: logError } = await supabase
        .from('good_responses')
        .insert({
          message_id: id,
          original_input,
          bad_response: message.message_content,
          corrected_response: correct_response,
          connection_id: message.whatsapp_conversations.connection_id
        });

      if (logError) {
        console.warn('Failed to log to good_responses (table might be missing):', logError.message);
        // Don't fail the request if just this table is missing, but log it.
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = createChatSupabaseClient();

  try {
    const { data: message, error: msgError } = await supabase
      .from('whatsapp_messages')
      .select('metadata')
      .eq('id', id)
      .single();

    if (msgError) throw msgError;

    const metadata = message.metadata || {};
    delete metadata.feedback_rating;
    delete metadata.correct_response;

    const { error: updateError } = await supabase
      .from('whatsapp_messages')
      .update({ metadata })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing feedback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
