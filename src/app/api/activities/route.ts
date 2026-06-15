import { getActivityStats } from '@/lib/content';
import { NextResponse } from 'next/server';

// 使用 Node.js runtime 以支持文件系统访问
export const runtime = 'nodejs';

export async function GET() {
  try {
    const activities = await getActivityStats();
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json([], { status: 500 });
  }
}
