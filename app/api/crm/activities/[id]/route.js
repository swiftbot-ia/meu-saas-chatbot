import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PATCH - Update activity (mark as completed/uncompleted, edit details)
export async function PATCH(request, { params }) {
    const supabase = createChatSupabaseClient();

    try {
        const { id } = await params;
        const body = await request.json();
        const { completed, title, description, scheduled_at, type } = body;

        const updateData = {
            updated_at: new Date().toISOString()
        };

        // Handle completion status
        if (completed !== undefined) {
            updateData.completed_at = completed ? new Date().toISOString() : null;
        }

        // Handle other fields
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
        if (type !== undefined) updateData.type = type;

        const { data, error } = await supabase
            .from('crm_activities')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Activity not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ activity: data });
    } catch (error) {
        console.error('Error updating activity:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove activity
export async function DELETE(request, { params }) {
    const supabase = createChatSupabaseClient();

    try {
        const { id } = await params;

        const { error } = await supabase
            .from('crm_activities')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting activity:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
