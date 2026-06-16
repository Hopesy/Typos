import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_SESSION_KEY = 'typos_admin';

export const runtime = 'nodejs';

async function getFileSystemContent() {
  try {
    const [{ default: fs }, { default: path }] = await Promise.all([
      import('node:fs/promises'),
      import('node:path'),
    ]);
    return { fs, path };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_KEY);

  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const filename = url.searchParams.get('filename');

  if (!type || !filename || !['post', 'daily', 'moment'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const fsContent = await getFileSystemContent();
  if (!fsContent) {
    return NextResponse.json({ error: 'File system not available' }, { status: 503 });
  }

  const { fs, path } = fsContent;
  const contentRoot = path.join(process.cwd(), 'content');

  const typeMap: Record<string, string> = {
    post: 'posts',
    daily: 'daily',
    moment: 'moments',
  };

  const dir = typeMap[type];
  const filePath = path.join(contentRoot, dir, filename);

  try {
    // 安全检查：确保文件在正确的目录中
    const normalizedPath = path.normalize(filePath);
    const normalizedDir = path.normalize(path.join(contentRoot, dir));

    if (!normalizedPath.startsWith(normalizedDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    const content = await fs.readFile(filePath, 'utf-8');

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
