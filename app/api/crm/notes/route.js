import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_NOTES_PER_CONVERSATION = 50;

// GET - List notes for a conversation (limited to 50, most recent first)
export async function GET(request) {
    const supabase = createChatSupabaseClient();

    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversation_id');
        const instanceName = searchParams.get('instance_name');

        if (!conversationId) {
            return NextResponse.json(
                { error: 'conversation_id parameter is required' },
                { status: 400 }
            );
        }

        let query = supabase
            .from('crm_notes')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(MAX_NOTES_PER_CONVERSATION);

        if (instanceName) {
            query = query.eq('instance_name', instanceName);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({ notes: data });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create a new note (enforce 50 notes limit by deleting oldest)
export async function POST(request) {
    const supabase = createChatSupabaseClient();

    try {
        const body = await request.json();
        const { conversation_id, instance_name, content } = body;

        // Validate required fields
        if (!conversation_id || !instance_name || !content) {
            return NextResponse.json(
                { error: 'conversation_id, instance_name, and content are required' },
                { status: 400 }
            );
        }

        // Check current note count and delete oldest if at limit
        const { data: existingNotes, error: countError } = await supabase
            .from('crm_notes')
            .select('id')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: true });

        if (countError) {
            throw countError;
        }

        // If at or over limit, delete the oldest notes to make room
        if (existingNotes && existingNotes.length >= MAX_NOTES_PER_CONVERSATION) {
            const notesToDelete = existingNotes.slice(0, existingNotes.length - MAX_NOTES_PER_CONVERSATION + 1);
            const idsToDelete = notesToDelete.map(note => note.id);

            const { error: deleteError } = await supabase
                .from('crm_notes')
                .delete()
                .in('id', idsToDelete);

            if (deleteError) {
                console.error('Error deleting old notes:', deleteError);
            }
        }

        // Insert the new note
        const { data, error } = await supabase
            .from('crm_notes')
            .insert({
                conversation_id,
                instance_name,
                content
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ note: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
