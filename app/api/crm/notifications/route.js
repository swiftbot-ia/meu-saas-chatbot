import { createChatSupabaseClient } from '@/lib/supabase/chat-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Get pending notifications (activities scheduled in the next 30 minutes)
export async function GET(request) {
    const supabase = createChatSupabaseClient();

    try {
        const { searchParams } = new URL(request.url);
        const instanceName = searchParams.get('instance_name');

        if (!instanceName) {
            return NextResponse.json(
                { error: 'instance_name parameter is required' },
                { status: 400 }
            );
        }

        // Calculate time window: now to 30 minutes from now
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        // Get activities scheduled in the next 30 minutes that haven't been completed
        const { data: activities, error } = await supabase
            .from('crm_activities')
            .select(`
                *,
                conversation:whatsapp_conversations(
                    id,
                    contact:whatsapp_contacts(name, whatsapp_number, profile_pic_url)
                )
            `)
            .eq('instance_name', instanceName)
            .is('completed_at', null)
            .gte('scheduled_at', now.toISOString())
            .lte('scheduled_at', thirtyMinutesFromNow.toISOString())
            .order('scheduled_at', { ascending: true });

        if (error) {
            throw error;
        }

        // Format notifications
        const notifications = activities.map(activity => ({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            scheduled_at: activity.scheduled_at,
            conversation_id: activity.conversation_id,
            contact_name: activity.conversation?.contact?.name ||
                activity.conversation?.contact?.whatsapp_number ||
                'Contato',
            contact_pic: activity.conversation?.contact?.profile_pic_url,
            minutes_until: Math.round((new Date(activity.scheduled_at) - now) / 60000)
        }));

        return NextResponse.json({
            notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
