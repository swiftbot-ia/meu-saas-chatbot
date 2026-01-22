import { createClient, supabaseAdmin } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Get member role using ADMIN client to bypass RLS issues
        // Use supabaseAdmin if available, otherwise fall back to session client
        const dbClient = supabaseAdmin || supabase;

        const { data: member } = await dbClient
            .from('account_members')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!member) {
            return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
        }

        const role = member.role;
        let restrictedRoutes = [];

        if (role === 'consultant') {
            restrictedRoutes = [
                '/dashboard/agent-config',
                '/automations',
                '/settings',
                '/account/team',
                '/account/subscription'
            ];
        }

        return NextResponse.json({
            success: true,
            permissions: {
                role,
                restrictedRoutes
            }
        });

    } catch (error) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
