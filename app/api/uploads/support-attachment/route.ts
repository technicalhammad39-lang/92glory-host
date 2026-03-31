import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadCandidate = {
  name?: string;
  type?: string;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function getExtension(fileName: string) {
  const ext = path.extname(fileName || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext;
  return '.jpg';
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const fileField = formData.get('file') || formData.get('image') || formData.get('attachment');

    if (!fileField || typeof fileField !== 'object' || !('arrayBuffer' in fileField)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }

    const file = fileField as UploadCandidate;
    const fileType = String(file.type || '').toLowerCase();
    const fileName = String(file.name || '');
    const fileSize = Number(file.size || 0);

    if (fileType && !fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image size must be less than 10MB.' }, { status: 400 });
    }

    const ext = getExtension(fileName);
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const relativeDir = path.join('uploads', 'support');
    const absoluteDir = path.join(process.cwd(), 'public', relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });

    const absoluteFilePath = path.join(absoluteDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absoluteFilePath, buffer);

    return NextResponse.json({
      url: `/${relativeDir.replace(/\\/g, '/')}/${safeName}`
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/uploads/support-attachment POST failed:', error);
    }
    return NextResponse.json({ error: 'Unable to upload image.' }, { status: 503 });
  }
}
