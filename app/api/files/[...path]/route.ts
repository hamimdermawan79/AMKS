import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile, stat } from 'fs/promises';
import { extname } from 'path';

const mimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const pathArray = (await params).path;
    if (!pathArray || pathArray.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Gabungkan path untuk menunjuk ke public/uploads/...
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathArray);

    // Keamanan: Cegah directory traversal (contoh: ../../../etc/passwd)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Cek apakah file benar-benar ada di hardisk
    try {
      await stat(filePath);
    } catch (e) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Baca file dan kirim ke client
    const fileBuffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        // Filename is UUID — safe to cache long, but avoid immutable so replace-in-place still works
        'Cache-Control': 'public, max-age=86400, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
