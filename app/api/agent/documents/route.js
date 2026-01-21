import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import embeddingsService from '@/lib/EmbeddingsService';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/agent/documents
 * List all documents for the authenticated user's agent
 * Query params: category (optional)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryFilter = searchParams.get('category');

        // Get user session
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
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Get agent for this user
        const { data: agent, error: agentError } = await supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (agentError || !agent) {
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
 * 
 * Body: { 
 *   content: string, 
 *   title?: string, 
 *   category?: string,
 *   file_type?: 'text_input' | 'txt' | 'pdf' | 'doc' | 'docx' | 'xlsx',
 *   file_name?: string,
 *   file_size?: number
 * }
 */
export async function POST(request) {
    try {
        // Get user session
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
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Get agent for this user
        const { data: agent, error: agentError } = await supabaseAdmin
            .from('ai_agents')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (agentError || !agent) {
            return NextResponse.json(
                { error: 'Agente não encontrado. Configure seu agente primeiro.' },
                { status: 404 }
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
            file_size
        } = body;

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
                { error: 'Serviço de embeddings não configurado' },
                { status: 500 }
            );
        }

        // Process document into chunks with embeddings
        const docTitle = title || file_name || 'Documento sem título';

        console.log(`📄 Processing ${file_type} document "${docTitle}" for agent ${agent.id}`);

        const { chunks, usage } = await embeddingsService.processDocument(content, {
            title: docTitle
        });

        // Insert all chunks into database with new schema
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
            context_summary: null, // Can be enhanced with LLM summary later
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
