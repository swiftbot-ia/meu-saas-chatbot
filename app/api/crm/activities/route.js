import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Activity types with labels
const ACTIVITY_TYPES = {
    call: 'Ligação',
    meeting: 'Reunião',
    email: 'E-mail',
    task: 'Tarefa',
    whatsapp: 'WhatsApp',
    visit: 'Visita',
    closing: 'Fechamento'
};

// GET - List activities for a conversation
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
            .from('crm_activities')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('scheduled_at', { ascending: true });

        if (instanceName) {
            query = query.eq('instance_name', instanceName);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            activities: data,
            types: ACTIVITY_TYPES
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create a new activity
export async function POST(request) {
    const supabase = createChatSupabaseClient();

    try {
        const body = await request.json();
        const { conversation_id, instance_name, type, title, description, scheduled_at } = body;

        // Validate required fields
        if (!conversation_id || !instance_name || !type || !title || !scheduled_at) {
            return NextResponse.json(
                { error: 'conversation_id, instance_name, type, title, and scheduled_at are required' },
                { status: 400 }
            );
        }

        // Validate activity type
        if (!ACTIVITY_TYPES[type]) {
            return NextResponse.json(
                { error: `Invalid activity type. Valid types: ${Object.keys(ACTIVITY_TYPES).join(', ')}` },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('crm_activities')
            .insert({
                conversation_id,
                instance_name,
                type,
                title,
                description: description || null,
                scheduled_at
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ activity: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating activity:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
