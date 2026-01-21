/**
 * Embeddings Service
 * Handles generation of vector embeddings using OpenAI API for RAG functionality
 */

import OpenAI from 'openai';

class EmbeddingsService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;

        if (!this.apiKey) {
            console.warn('⚠️ OPENAI_API_KEY not configured for embeddings');
        }

        this.client = new OpenAI({
            apiKey: this.apiKey
        });

        // Using text-embedding-3-small for cost efficiency
        // Dimensions: 1536 (same as ada-002, compatible with existing pgvector setup)
        this.model = 'text-embedding-3-small';
        this.dimensions = 1536;
    }

    /**
     * Generate embedding for a single text
     * @param {string} text - Text to generate embedding for
     * @returns {Promise<{embedding: number[], model: string, usage: object}>}
     */
    async generateEmbedding(text) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        if (!text || typeof text !== 'string') {
            throw new Error('Text must be a non-empty string');
        }

        // Clean and normalize text
        const cleanText = text.trim().replace(/\n+/g, ' ').substring(0, 8000);

        try {
            const response = await this.client.embeddings.create({
                model: this.model,
                input: cleanText,
                dimensions: this.dimensions
            });

            return {
                embedding: response.data[0].embedding,
                model: this.model,
                usage: response.usage
            };
        } catch (error) {
            console.error('❌ Error generating embedding:', error);
            throw error;
        }
    }

    /**
     * Generate embeddings for multiple texts (batch)
     * @param {string[]} texts - Array of texts to generate embeddings for
     * @returns {Promise<{embeddings: number[][], model: string, usage: object}>}
     */
    async generateEmbeddings(texts) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error('Texts must be a non-empty array');
        }

        // Clean and normalize texts
        const cleanTexts = texts.map(t =>
            t.trim().replace(/\n+/g, ' ').substring(0, 8000)
        );

        try {
            const response = await this.client.embeddings.create({
                model: this.model,
                input: cleanTexts,
                dimensions: this.dimensions
            });

            return {
                embeddings: response.data.map(d => d.embedding),
                model: this.model,
                usage: response.usage
            };
        } catch (error) {
            console.error('❌ Error generating batch embeddings:', error);
            throw error;
        }
    }

    /**
     * Split text into chunks for embedding
     * @param {string} text - Full text to split
     * @param {number} chunkSize - Target chunk size in characters (default: 1000)
     * @param {number} overlap - Overlap between chunks (default: 200)
     * @returns {string[]} Array of text chunks
     */
    splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const chunks = [];
        const sentences = text.split(/(?<=[.!?])\s+/);
        let currentChunk = '';

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length <= chunkSize) {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }

                // Start new chunk with overlap from previous
                if (overlap > 0 && currentChunk.length > overlap) {
                    const overlapText = currentChunk.slice(-overlap);
                    currentChunk = overlapText + ' ' + sentence;
                } else {
                    currentChunk = sentence;
                }
            }
        }

        // Add remaining text
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Process document: split into chunks and generate embeddings
     * @param {string} content - Full document content
     * @param {object} metadata - Additional metadata to attach
     * @returns {Promise<{chunks: Array<{content: string, embedding: number[], metadata: object}>}>}
     */
    async processDocument(content, metadata = {}) {
        const chunks = this.splitTextIntoChunks(content);

        if (chunks.length === 0) {
            throw new Error('No content to process');
        }

        console.log(`📄 Processing document: ${chunks.length} chunks`);

        // Generate embeddings for all chunks
        const { embeddings, usage } = await this.generateEmbeddings(chunks);

        // Combine chunks with their embeddings
        const processedChunks = chunks.map((chunk, index) => ({
            content: chunk,
            embedding: embeddings[index],
            metadata: {
                ...metadata,
                chunk_index: index,
                total_chunks: chunks.length
            }
        }));

        console.log(`✅ Document processed: ${chunks.length} chunks, ${usage.total_tokens} tokens used`);

        return {
            chunks: processedChunks,
            usage
        };
    }

    /**
     * Check if service is configured
     * @returns {boolean}
     */
    isConfigured() {
        return !!this.apiKey;
    }
}

// Export singleton instance
const embeddingsService = new EmbeddingsService();
export default embeddingsService;
