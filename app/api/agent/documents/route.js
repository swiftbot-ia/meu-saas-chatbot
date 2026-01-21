import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import embeddingsService from '@/lib/EmbeddingsService';

/**
 * GET /api/agent/documents
 * List all documents for the authenticated user's agent
 * Query params: category (optional)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryFilter = searchParams.get('category');

        // Get user session using server client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('❌ [Documents API] Auth error:', authError?.message);
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Get agent for this user - support multiple agents by using connection_id if provided
        const connectionId = searchParams.get('connectionId');
        console.log('🔍 [Documents API] Looking for agent with user_id:', user.id, 'connectionId:', connectionId);

        let agentQuery = supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id);

        // If connectionId is provided, filter by it
        if (connectionId) {
            agentQuery = agentQuery.eq('connection_id', connectionId);
        }

        const { data: agents, error: agentError } = await agentQuery.limit(1);

        console.log('🔍 [Documents API] Agent query result:', { agents, error: agentError?.message });

        const agent = agents?.[0];
        if (agentError || !agent) {
            console.log('⚠️ [Documents API] Agent not found for user:', user.id);
            return NextResponse.json(
                { documents: [], categories: [], message: 'Agente não encontrado' },
                { status: 200 }
            );
        }

        // Fetch documents for this agent
        let query = supabaseAdmin
            .from('documents')
            .select('id, content, title, category, file_type, file_name, chunk_number, total_chunks, context_summary, created_at')
            .eq('agent_id', agent.id)
            .order('created_at', { ascending: false });

        if (categoryFilter) {
            query = query.eq('category', categoryFilter);
        }

        const { data: documents, error: docsError } = await query;

        if (docsError) {
            console.error('❌ Error fetching documents:', docsError);
            return NextResponse.json(
                { error: 'Erro ao buscar documentos' },
                { status: 500 }
            );
        }

        // Fetch categories for this agent
        const { data: categories } = await supabaseAdmin
            .from('document_categories')
            .select('id, name, description, color')
            .eq('agent_id', agent.id)
            .order('name');

        // Format response
        const formattedDocs = (documents || []).map(doc => ({
            id: doc.id,
            content: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''),
            full_content: doc.content,
            title: doc.title || 'Documento sem título',
            category: doc.category || 'geral',
            file_type: doc.file_type || 'text_input',
            file_name: doc.file_name,
            chunk_number: doc.chunk_number,
            total_chunks: doc.total_chunks,
            context_summary: doc.context_summary,
            created_at: doc.created_at
        }));

        return NextResponse.json({
            documents: formattedDocs,
            categories: categories || [],
            total: formattedDocs.length
        });

    } catch (error) {
        console.error('❌ Error in GET /api/agent/documents:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/agent/documents
 * Upload and index a new document
 */
export async function POST(request) {
    try {
        // Get user session using server client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('❌ [Documents API] Auth error:', authError?.message);
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            content,
            title,
            category = 'geral',
            file_type = 'text_input',
            file_name,
            file_size,
            connectionId
        } = body;

        // Get agent for this user - support multiple agents
        let agentQuery = supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id);

        if (connectionId) {
            agentQuery = agentQuery.eq('connection_id', connectionId);
        }

        const { data: agents, error: agentError } = await agentQuery.limit(1);
        const agent = agents?.[0];

        if (agentError || !agent) {
            return NextResponse.json(
                { error: 'Agente não encontrado. Configure seu agente primeiro.' },
                { status: 404 }
            );
        }



        if (!content || typeof content !== 'string' || content.trim().length < 10) {
            return NextResponse.json(
                { error: 'Conteúdo deve ter pelo menos 10 caracteres' },
                { status: 400 }
            );
        }

        // Validate file_type
        const validFileTypes = ['text_input', 'txt', 'pdf', 'doc', 'docx', 'xlsx'];
        if (!validFileTypes.includes(file_type)) {
            return NextResponse.json(
                { error: `Tipo de arquivo inválido. Use: ${validFileTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Check embeddings service
        if (!embeddingsService.isConfigured()) {
            return NextResponse.json(
                { error: 'Serviço de embeddings não configurado. Verifique OPENAI_API_KEY.' },
                { status: 500 }
            );
        }

        // Process document into chunks with embeddings
        const docTitle = title || file_name || 'Documento sem título';

        console.log(`📄 Processing ${file_type} document "${docTitle}" for agent ${agent.id}`);

        const { chunks, usage } = await embeddingsService.processDocument(content, {
            title: docTitle
        });

        // Insert all chunks into database
        const documentsToInsert = chunks.map((chunk, index) => ({
            content: chunk.content,
            embedding: chunk.embedding,
            agent_id: agent.id,
            title: docTitle,
            category: category,
            file_type: file_type,
            file_name: file_name || null,
            file_size: file_size || null,
            chunk_number: index + 1,
            total_chunks: chunks.length,
            chunk_before: index > 0 ? chunks[index - 1].content.substring(0, 200) : null,
            chunk_after: index < chunks.length - 1 ? chunks[index + 1].content.substring(0, 200) : null,
            context_summary: null,
            metadata: {
                user_id: user.id,
                uploaded_at: new Date().toISOString()
            }
        }));

        const { data: insertedDocs, error: insertError } = await supabaseAdmin
            .from('documents')
            .insert(documentsToInsert)
            .select('id');

        if (insertError) {
            console.error('❌ Error inserting documents:', insertError);
            return NextResponse.json(
                { error: 'Erro ao salvar documentos: ' + insertError.message },
                { status: 500 }
            );
        }

        console.log(`✅ Inserted ${insertedDocs.length} document chunks for agent ${agent.id}`);

        return NextResponse.json({
            success: true,
            message: `Documento indexado com sucesso! ${chunks.length} chunk(s) criado(s).`,
            title: docTitle,
            category: category,
            file_type: file_type,
            chunks_created: chunks.length,
            tokens_used: usage.total_tokens,
            document_ids: insertedDocs.map(d => d.id)
        });

    } catch (error) {
        console.error('❌ Error in POST /api/agent/documents:', error);
        return NextResponse.json(
            { error: 'Erro ao processar documento: ' + error.message },
            { status: 500 }
        );
    }
}
