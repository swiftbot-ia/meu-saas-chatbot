/**
 * Contact Metadata API Route
 * PATCH /api/contacts/[id]/metadata - Atualiza metadata do contato (custom fields)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createChatSupabaseAdminClient } from '@/lib/supabase/chat-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper para criar cliente Supabase com cookies
async function createAuthClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value;
                },
                set(name, value, options) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name, options) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
}

export async function PATCH(request, { params }) {
    try {
        const supabase = await createAuthClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'ID do contato é obrigatório' }, { status: 400 });
        }

        const body = await request.json();
        const { custom_fields } = body;

        if (custom_fields === undefined) {
            return NextResponse.json({ error: 'custom_fields é obrigatório' }, { status: 400 });
        }

        const chatSupabase = createChatSupabaseAdminClient();

        // Get current contact metadata
        const { data: contact, error: fetchError } = await chatSupabase
            .from('whatsapp_contacts')
            .select('id, metadata')
            .eq('id', id)
            .single();

        if (fetchError || !contact) {
            return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
        }

        // Merge custom_fields into existing metadata
        const currentMetadata = contact.metadata || {};
        const updatedMetadata = {
            ...currentMetadata,
            custom_fields
        };

        // Update contact metadata
        const { error: updateError } = await chatSupabase
            .from('whatsapp_contacts')
            .update({ metadata: updatedMetadata })
            .eq('id', id);

        if (updateError) {
            console.error('Erro ao atualizar metadata:', updateError);
            return NextResponse.json({ error: 'Erro ao atualizar metadata' }, { status: 500 });
        }

        return NextResponse.json({ success: true, metadata: updatedMetadata });

    } catch (error) {
        console.error('Erro na API de metadata:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
