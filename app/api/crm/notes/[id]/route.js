import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// DELETE - Remove a note
export async function DELETE(request, { params }) {
    const supabase = createChatSupabaseClient();

    try {
        const { id } = await params;

        const { error } = await supabase
            .from('crm_notes')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
