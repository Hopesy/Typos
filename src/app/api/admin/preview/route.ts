import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { renderArticle } from "@/components/markdown-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRecord(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

// 后台编辑预览：复用文章页同一套渲染管线（remark/rehype + Shiki + KaTeX），
// 保证预览与发布后的真实文章 100% 一致。
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = asRecord(await request.json());
    const content = typeof body.content === "string" ? body.content : "";
    const { html } = await renderArticle(content);
    return noStore(NextResponse.json({ html }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}
