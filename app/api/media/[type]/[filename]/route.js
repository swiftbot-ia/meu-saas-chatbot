/**
 * API Route: /api/media/[type]/[filename]
 * Serves media files created after build (Next.js doesn't serve runtime files from /public)
 */

import { NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

// Content type mapping
const CONTENT_TYPES = {
    // Audio
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg',
    'wav': 'audio/wav',
    'webm': 'audio/webm',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    // Image
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'avif': 'image/avif',
    // Video
    'mp4': 'video/mp4',
    '3gp': 'video/3gpp',
    'mov': 'video/quicktime',
    // Document
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
};

export async function GET(request, { params }) {
    try {
        const { type, filename } = await params;

        // Validate type
        const validTypes = ['audio', 'image', 'video', 'document'];
        if (!validTypes.includes(type)) {
            return new NextResponse('Invalid media type', { status: 400 });
        }

        // Security check: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return new NextResponse('Invalid filename', { status: 400 });
        }

        const filePath = join(process.cwd(), 'public', 'media', type, filename);

        if (!existsSync(filePath)) {
            console.log(`[MediaAPI] File not found: ${filePath}`);
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = await readFile(filePath);
        const stats = await stat(filePath);

        // Determine content type from extension
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': stats.size.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('[MediaAPI] Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
