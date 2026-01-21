import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * DELETE /api/agent/documents/categories/[name]
 * Delete a category and all its documents
 */
export async function DELETE(request, { params }) {
    try {
        const { name } = await params;
        const categoryName = decodeURIComponent(name);

        const cookieStore = await cookies();
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value;
                    }
                }
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Get agent
        const { data: agent } = await supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!agent) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        // Delete all documents in this category
        await supabaseAdmin
            .from('documents')
            .delete()
            .eq('agent_id', agent.id)
            .eq('category', categoryName);

        // Delete the category
        const { error } = await supabaseAdmin
            .from('document_categories')
            .delete()
            .eq('agent_id', agent.id)
            .eq('name', categoryName);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Categoria e documentos deletados' });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
