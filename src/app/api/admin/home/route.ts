import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { requireAdmin } from '@/lib/admin-auth';
import { adminApiError } from '@/lib/admin-api-errors';
import {
  deleteHomeItem,
  getAdminHomeData,
  HomeManageError,
  reorderHomeItems,
  saveHomeBook,
  saveHomeStatus,
  saveHomeTool,
} from '@/lib/home-manage';

export const dynamic = 'force-dynamic';

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function handleError(error: unknown, fallbackCode: 'HOME_LOAD_FAILED' | 'HOME_SAVE_FAILED' | 'HOME_DELETE_FAILED') {
  if (error instanceof HomeManageError) {
    return noStore(NextResponse.json(adminApiError(error.code), { status: error.statusCode }));
  }
  console.error('Admin home API error:', error);
  return noStore(NextResponse.json(adminApiError(fallbackCode), { status: 500 }));
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json(adminApiError('DATABASE_UNAVAILABLE'), { status: 503 }));
  }

  try {
    const data = await getAdminHomeData(db);
    return noStore(NextResponse.json(data));
  } catch (error) {
    return handleError(error, 'HOME_LOAD_FAILED');
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json(adminApiError('DATABASE_UNAVAILABLE'), { status: 503 }));
  }

  let body: Record<string, unknown>;
  try {
    body = asRecord(await request.json());
  } catch {
    return noStore(NextResponse.json(adminApiError('INVALID_JSON'), { status: 400 }));
  }

  try {
    const section = typeof body.section === 'string' ? body.section : '';
    const payload = asRecord(body.data);

    if (section === 'status') {
      await saveHomeStatus(db, payload);
    } else if (section === 'tool') {
      await saveHomeTool(db, payload);
    } else if (section === 'book') {
      await saveHomeBook(db, payload);
    } else if (section === 'reorder') {
      const target = body.target === 'book' ? 'book' : body.target === 'tool' ? 'tool' : '';
      if (!target) {
        return noStore(NextResponse.json(adminApiError('INVALID_CONTENT_TYPE'), { status: 400 }));
      }
      await reorderHomeItems(db, target, body.ids);
    } else {
      return noStore(NextResponse.json(adminApiError('INVALID_CONTENT_TYPE'), { status: 400 }));
    }

    const data = await getAdminHomeData(db);
    return noStore(NextResponse.json({ success: true, ...data }));
  } catch (error) {
    return handleError(error, 'HOME_SAVE_FAILED');
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json(adminApiError('DATABASE_UNAVAILABLE'), { status: 503 }));
  }

  let body: Record<string, unknown>;
  try {
    body = asRecord(await request.json());
  } catch {
    return noStore(NextResponse.json(adminApiError('INVALID_JSON'), { status: 400 }));
  }

  try {
    const section = body.section === 'book' ? 'book' : body.section === 'tool' ? 'tool' : '';
    if (!section) {
      return noStore(NextResponse.json(adminApiError('INVALID_CONTENT_TYPE'), { status: 400 }));
    }

    await deleteHomeItem(db, section, body.id);
    const data = await getAdminHomeData(db);
    return noStore(NextResponse.json({ success: true, ...data }));
  } catch (error) {
    return handleError(error, 'HOME_DELETE_FAILED');
  }
}
