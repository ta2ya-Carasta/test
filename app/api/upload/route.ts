import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prisma';
import { authOptions } from '../../../lib/auth';
import { getCurrentMonthRange } from '../../../lib/date';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: '対応していないファイル形式です' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
  }

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

  const uploadCount = await prisma.upload.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: monthStart,
        lt: monthEnd
      }
    }
  });

  if (uploadCount >= user.monthlyLimit) {
    return NextResponse.json(
      { error: `月間アップロード上限(${user.monthlyLimit}件)に達しました` },
      { status: 429 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fallbackExtension = file.type ? `.${file.type.split('/')[1]}` : '';
    const extension = path.extname(file.name) || fallbackExtension || '';
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(filePath, buffer);

    await prisma.upload.create({
      data: {
        userId: user.id,
        storedFilename: fileName,
        originalName: file.name
      }
    });

    return NextResponse.json({ success: true, fileName });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーでエラーが発生しました' }, { status: 500 });
  }
}
