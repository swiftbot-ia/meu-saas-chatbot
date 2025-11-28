/**
 * ============================================================================
 * API Route: Serve Stored Media Files
 * ============================================================================
 * Serves media files stored locally on VPS
 * Path: /api/media/audio/2025-11-28_abc123.ogg
 * ============================================================================
 */

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * GET - Serve media file
 */
export async function GET(request, { params }) {
  try {
    // Get file path from params
    const filePath = params.path.join('/')

    // Validate path to prevent directory traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      return new NextResponse('Invalid path', { status: 400 })
    }

    // Construct full file path
    const baseDir = path.join(process.cwd(), 'storage', 'media')
    const fullPath = path.join(baseDir, filePath)

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Read file
    const fileBuffer = fs.readFileSync(fullPath)

    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase()
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'audio/ogg',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    const contentType = contentTypes[ext] || 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`
      }
    })

  } catch (error) {
    console.error('❌ Erro ao servir arquivo:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
