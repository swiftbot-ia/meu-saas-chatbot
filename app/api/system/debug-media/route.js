import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cwd = process.cwd();
    const publicDir = path.join(cwd, 'public');
    const mediaDir = path.join(publicDir, 'media');

    const debugInfo = {
        cwd,
        publicDirExists: fs.existsSync(publicDir),
        mediaDirExists: fs.existsSync(mediaDir),
        mediaDirs: {},
        env: {
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
            NODE_ENV: process.env.NODE_ENV
        }
    };

    if (fs.existsSync(mediaDir)) {
        try {
            const subdirs = ['image', 'video', 'audio', 'document'];
            for (const dir of subdirs) {
                const targetDir = path.join(mediaDir, dir);
                if (fs.existsSync(targetDir)) {
                    // Get file stats for sample files to verify they are readable and have size
                    const fileNames = fs.readdirSync(targetDir).slice(0, 5);
                    const filesWithStats = fileNames.map(name => {
                        try {
                            const stat = fs.statSync(path.join(targetDir, name));
                            return { name, size: stat.size, mode: stat.mode };
                        } catch (e) {
                            return { name, error: e.message };
                        }
                    });

                    debugInfo.mediaDirs[dir] = {
                        exists: true,
                        path: targetDir,
                        fileCount: fs.readdirSync(targetDir).length,
                        sampleFiles: filesWithStats
                    };
                } else {
                    debugInfo.mediaDirs[dir] = { exists: false, path: targetDir };
                }
            }
        } catch (error) {
            debugInfo.error = error.message;
        }
    }

    return NextResponse.json(debugInfo, { status: 200 });
}
