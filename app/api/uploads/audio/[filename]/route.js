import { NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(request, { params }) {
    try {
        const { filename } = await params; // await params in Next.js 15

        // Security check: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return new NextResponse('Invalid filename', { status: 400 });
        }

        const filePath = join(process.cwd(), 'public', 'uploads', 'audio', filename);

        if (!existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = await readFile(filePath);
        const stats = await stat(filePath);

        // Determine content type (default to audio/webm as that's what we save)
        let contentType = 'audio/webm';
        if (filename.endsWith('.mp3')) contentType = 'audio/mpeg';
        if (filename.endsWith('.wav')) contentType = 'audio/wav';
        if (filename.endsWith('.ogg')) contentType = 'audio/ogg';
        if (filename.endsWith('.m4a')) contentType = 'audio/mp4';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': stats.size.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving audio file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
